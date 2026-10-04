import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Dsa, DsaStatus } from './entities/dsa.entity';
import { DsaExpenseItem, DsaExpenseCategory } from './entities/dsa-expense-item.entity';
import { CreateDsaDto } from './dto/create-dsa.dto';
import { ApproveDsaDto } from './dto/approve-dsa.dto';
import { SettleDsaDto } from './dto/settle-dsa.dto';
import { RejectDsaDto } from './dto/reject-dsa.dto';
import { Project } from 'src/projects/entities/project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/enums/notification-type.enum';
import { DsaMath } from './utils/dsa-math.util';

@Injectable()
export class DsaService {
  constructor(
    @InjectRepository(Dsa)
    private dsaRepository: Repository<Dsa>,
    @InjectRepository(DsaExpenseItem)
    private dsaExpenseItemRepository: Repository<DsaExpenseItem>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Helper to normalize role names for comparison
   */
  private normalizeRole(roleName?: string): string {
    if (!roleName) return '';
    return roleName.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Helper to check if a user is an authorized approver for a project DSA
   */
  private canApproveDsa(project: Project, user: UserEntity): boolean {
    const userRole = this.normalizeRole(user.role?.name);

    if (['superuser', 'administrator', 'admin'].includes(userRole)) {
      return true;
    }

    const isProjectLead = project.projectLead && project.projectLead.id === user.id;
    const isProjectManager = project.projectManager && project.projectManager.id === user.id;

    return isProjectLead || isProjectManager;
  }

  async create(createDsaDto: CreateDsaDto, requester: UserEntity) {
    const project = await this.projectRepository.findOne({
      where: { id: createDsaDto.projectId },
      relations: ['projectLead', 'projectManager'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status === 'signed_off') {
      throw new BadRequestException('Cannot request DSA for signed off project');
    }

    // Idempotency verification: if key supplied, check if existing DSAs already created
    if (createDsaDto.idempotencyKey) {
      const existingDsas = await this.dsaRepository.find({
        where: {
          idempotencyKey: createDsaDto.idempotencyKey,
          projectId: createDsaDto.projectId,
        },
        relations: [
          'project',
          'requester',
          'requestedBy',
          'approvedBy',
          'verifiedBy',
          'expenseItems',
        ],
      });

      if (existingDsas && existingDsas.length > 0) {
        return existingDsas;
      }
    }

    const requesterRole = this.normalizeRole(requester.role?.name);

    const targetUsers = await this.dsaRepository.manager.getRepository(UserEntity).find({
      where: { id: In(createDsaDto.userIds) },
      relations: ['role'],
    });

    if (!targetUsers || targetUsers.length === 0) {
      throw new BadRequestException('No valid beneficiary users specified');
    }

    const isAssignedLeadOrManager =
      (project.projectLead && project.projectLead.id === requester.id) ||
      (project.projectManager && project.projectManager.id === requester.id);

    for (const targetUser of targetUsers) {
      const targetRole = this.normalizeRole(targetUser.role?.name);

      if (['superuser', 'administrator', 'admin'].includes(requesterRole)) continue;
      if (isAssignedLeadOrManager) continue;

      if (requesterRole === 'projectmanager') {
        if (['projectmanager', 'teamlead', 'auditsenior', 'auditjunior'].includes(targetRole))
          continue;
      }

      if (requesterRole === 'auditsenior') {
        if (['auditsenior', 'auditjunior'].includes(targetRole)) continue;
      }

      if (requesterRole === 'auditjunior') {
        if (targetUser.id === requester.id) continue;
      }

      throw new ForbiddenException(
        `You are not allowed to request DSA for user ${targetUser.name} (${targetUser.role?.name})`,
      );
    }

    const normalizedRequestedAmount = DsaMath.fromCents(
      DsaMath.toCents(createDsaDto.requestedAmount),
    );

    const dsas: Dsa[] = [];
    for (const targetUser of targetUsers) {
      const dsa = this.dsaRepository.create({
        project,
        requester: targetUser,
        requestedBy: requester,
        requestedAmount: normalizedRequestedAmount,
        advanceRequestedAmount: normalizedRequestedAmount,
        idempotencyKey: createDsaDto.idempotencyKey,
        type: createDsaDto.type,
        description: createDsaDto.description,
        status: DsaStatus.REQUESTED,
      });
      dsas.push(dsa);
    }

    const savedDsas = await this.dsaRepository.save(dsas);

    const notifyUserIds = new Set<string>();
    if (project.projectLead && project.projectLead.id !== requester.id) {
      notifyUserIds.add(project.projectLead.id);
    }
    if (project.projectManager && project.projectManager.id !== requester.id) {
      notifyUserIds.add(project.projectManager.id);
    }

    if (notifyUserIds.size > 0) {
      await this.notificationService.create({
        message: `New DSA request of NRs. ${normalizedRequestedAmount} submitted for project ${project.name}`,
        link: `/projects/${project.id}/dsa`,
        type: NotificationType.GENERAL,
        users: Array.from(notifyUserIds),
      });
    }

    return savedDsas;
  }

  async findAllByProject(projectId: string, user: UserEntity) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['projectLead', 'projectManager'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const userRole = this.normalizeRole(user.role?.name);
    const isManagerOrLead =
      (project.projectLead && project.projectLead.id === user.id) ||
      (project.projectManager && project.projectManager.id === user.id) ||
      ['superuser', 'administrator', 'admin'].includes(userRole);

    if (isManagerOrLead) {
      return this.dsaRepository.find({
        where: { project: { id: projectId } },
        relations: [
          'project',
          'requester',
          'requestedBy',
          'approvedBy',
          'verifiedBy',
          'expenseItems',
        ],
        order: { createdAt: 'DESC' },
      });
    } else {
      return this.dsaRepository.find({
        where: [
          { project: { id: projectId }, requester: { id: user.id } },
          { project: { id: projectId }, requestedBy: { id: user.id } },
        ],
        relations: [
          'project',
          'requester',
          'requestedBy',
          'approvedBy',
          'verifiedBy',
          'expenseItems',
        ],
        order: { createdAt: 'DESC' },
      });
    }
  }

  async findOne(id: string) {
    const dsa = await this.dsaRepository.findOne({
      where: { id },
      relations: [
        'project',
        'project.projectLead',
        'project.projectManager',
        'requester',
        'requestedBy',
        'approvedBy',
        'verifiedBy',
        'expenseItems',
      ],
    });
    if (!dsa) {
      throw new NotFoundException('DSA request not found');
    }
    return dsa;
  }

  async approve(id: string, approveDsaDto: ApproveDsaDto, user: UserEntity) {
    const dsa = await this.findOne(id);

    if (dsa.status !== DsaStatus.REQUESTED) {
      throw new BadRequestException(
        `Cannot approve DSA in '${dsa.status}' status. Request must be in 'requested' state.`,
      );
    }

    if (dsa.project.status === 'signed_off') {
      throw new BadRequestException('Cannot approve DSA for signed off project');
    }

    if (!this.canApproveDsa(dsa.project, user)) {
      throw new ForbiddenException(
        'You are not authorized to approve DSA requests for this project',
      );
    }

    const normalizedApprovedAmount = DsaMath.fromCents(
      DsaMath.toCents(approveDsaDto.approvedAmount),
    );

    dsa.approvedAmount = normalizedApprovedAmount;
    dsa.advanceApprovedAmount = normalizedApprovedAmount;
    dsa.adminRemarks = approveDsaDto.adminRemarks;
    dsa.approvedBy = user;
    dsa.approvedAt = new Date();
    dsa.status = DsaStatus.APPROVED;

    const savedDsa = await this.dsaRepository.save(dsa);

    const notifyUserIds = new Set<string>();
    if (dsa.requester && dsa.requester.id) notifyUserIds.add(dsa.requester.id);
    if (dsa.requestedBy && dsa.requestedBy.id) notifyUserIds.add(dsa.requestedBy.id);

    if (notifyUserIds.size > 0) {
      await this.notificationService.create({
        message: `Your DSA request for project ${dsa.project.name} has been approved for NRs. ${normalizedApprovedAmount}`,
        link: `/projects/${dsa.project.id}/dsa`,
        type: NotificationType.GENERAL,
        users: Array.from(notifyUserIds),
      });
    }

    return savedDsa;
  }

  async reject(id: string, rejectDsaDto: RejectDsaDto, user: UserEntity) {
    const dsa = await this.findOne(id);

    if (dsa.status !== DsaStatus.REQUESTED) {
      throw new BadRequestException(
        `Cannot reject DSA in '${dsa.status}' status. Request must be in 'requested' state.`,
      );
    }

    if (dsa.project.status === 'signed_off') {
      throw new BadRequestException('Cannot reject DSA for signed off project');
    }

    if (!this.canApproveDsa(dsa.project, user)) {
      throw new ForbiddenException('You are not authorized to reject DSA requests for this project');
    }

    dsa.status = DsaStatus.REJECTED;
    if (rejectDsaDto.adminRemarks) {
      dsa.adminRemarks = rejectDsaDto.adminRemarks;
    }

    const savedDsa = await this.dsaRepository.save(dsa);

    const notifyUserIds = new Set<string>();
    if (dsa.requester && dsa.requester.id) notifyUserIds.add(dsa.requester.id);
    if (dsa.requestedBy && dsa.requestedBy.id) notifyUserIds.add(dsa.requestedBy.id);

    if (notifyUserIds.size > 0) {
      await this.notificationService.create({
        message: `Your DSA request for project ${dsa.project.name} has been rejected.`,
        link: `/projects/${dsa.project.id}/dsa`,
        type: NotificationType.GENERAL,
        users: Array.from(notifyUserIds),
      });
    }

    return savedDsa;
  }

  async settle(id: string, settleDsaDto: SettleDsaDto, user: UserEntity) {
    const dsa = await this.findOne(id);

    if (dsa.project.status === 'signed_off') {
      throw new BadRequestException('Cannot settle DSA for signed off project');
    }

    const userRole = this.normalizeRole(user.role?.name);
    const isBeneficiary = dsa.requester && dsa.requester.id === user.id;
    const isCreator = dsa.requestedBy && dsa.requestedBy.id === user.id;
    const isAdminOrManager = [
      'superuser',
      'administrator',
      'admin',
      'projectmanager',
    ].includes(userRole);

    if (!isBeneficiary && !isCreator && !isAdminOrManager) {
      throw new ForbiddenException('You can only settle your own DSA requests');
    }

    if (dsa.status !== DsaStatus.APPROVED) {
      throw new BadRequestException('DSA must be approved before settlement');
    }

    // Process itemized expenses if provided
    let totalClaimed: number = settleDsaDto.settlementAmount;
    const parsedItems: any[] = [];

    if (settleDsaDto.expenseItems) {
      try {
        const rawItems = JSON.parse(settleDsaDto.expenseItems);
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          const itemAmounts: number[] = [];
          for (const raw of rawItems) {
            const amt = DsaMath.fromCents(DsaMath.toCents(raw.amount));
            itemAmounts.push(amt);
            parsedItems.push({
              category: raw.category || DsaExpenseCategory.OTHER,
              expenseDate: raw.expenseDate || new Date().toISOString().split('T')[0],
              amount: amt,
              receiptNumber: raw.receiptNumber,
              billImage: raw.billImage,
              remarks: raw.remarks,
            });
          }
          totalClaimed = DsaMath.sum(itemAmounts);
        }
      } catch (err) {
        console.error('Failed to parse expenseItems JSON:', err);
      }
    } else {
      totalClaimed = DsaMath.fromCents(DsaMath.toCents(settleDsaDto.settlementAmount));
    }

    // Advance netting formula: Net = Total Claimed Expenses - Approved Advance
    const advancePaid = dsa.advanceApprovedAmount || dsa.approvedAmount || 0;
    const netSettlement = DsaMath.subtract(totalClaimed, advancePaid);

    dsa.settlementAmount = totalClaimed;
    dsa.totalClaimedAmount = totalClaimed;
    dsa.netSettlementAmount = netSettlement;
    dsa.billDetails = settleDsaDto.billDetails;
    if (settleDsaDto.billImage) {
      dsa.billImage = settleDsaDto.billImage;
    }
    dsa.settledAt = new Date();
    dsa.status = DsaStatus.SETTLED;

    const savedDsa = await this.dsaRepository.save(dsa);

    // Save child expense items
    if (parsedItems.length > 0) {
      const itemsToSave = parsedItems.map((item) => ({
        category: item.category,
        expenseDate: item.expenseDate,
        amount: item.amount,
        receiptNumber: item.receiptNumber,
        billImage: item.billImage,
        remarks: item.remarks,
        dsa: savedDsa,
        dsaId: savedDsa.id,
      }));
      await this.dsaExpenseItemRepository.save(itemsToSave);
    }

    // Notify Project Manager & Team Lead for verification
    const notifyUserIds = new Set<string>();
    if (dsa.project.projectLead && dsa.project.projectLead.id !== user.id) {
      notifyUserIds.add(dsa.project.projectLead.id);
    }
    if (dsa.project.projectManager && dsa.project.projectManager.id !== user.id) {
      notifyUserIds.add(dsa.project.projectManager.id);
    }

    if (notifyUserIds.size > 0) {
      const netMsg =
        netSettlement >= 0
          ? `(Company reimburses: NRs. ${netSettlement})`
          : `(Employee refunds: NRs. ${Math.abs(netSettlement)})`;

      await this.notificationService.create({
        message: `DSA settlement of NRs. ${totalClaimed} ${netMsg} submitted for project ${dsa.project.name}`,
        link: `/projects/${dsa.project.id}/dsa`,
        type: NotificationType.GENERAL,
        users: Array.from(notifyUserIds),
      });
    }

    return this.findOne(savedDsa.id);
  }

  async verify(id: string, user: UserEntity) {
    const dsa = await this.findOne(id);

    if (dsa.project.status === 'signed_off') {
      throw new BadRequestException('Cannot verify DSA for signed off project');
    }

    if (dsa.status !== DsaStatus.SETTLED) {
      throw new BadRequestException('DSA must be settled before verification');
    }

    if (!this.canApproveDsa(dsa.project, user)) {
      throw new ForbiddenException(
        'You are not authorized to verify DSA settlements for this project',
      );
    }

    dsa.status = DsaStatus.VERIFIED;
    dsa.verifiedBy = user;
    dsa.verifiedAt = new Date();

    const savedDsa = await this.dsaRepository.save(dsa);

    if (dsa.requester && dsa.requester.id) {
      await this.notificationService.create({
        message: `Your DSA settlement for project ${dsa.project.name} has been verified and completed.`,
        link: `/projects/${dsa.project.id}/dsa`,
        type: NotificationType.GENERAL,
        users: [dsa.requester.id],
      });
    }

    return savedDsa;
  }
}
