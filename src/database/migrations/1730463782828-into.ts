import {MigrationInterface, QueryRunner} from "typeorm";

export class into1730463782828 implements MigrationInterface {
    name = 'into1730463782828'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdBy" character varying, "updatedBy" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "message" character varying NOT NULL, "type" character varying, "link" character varying, "isRead" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_notification" ("notificationId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_766785a5a35127ae6570088aa2d" PRIMARY KEY ("notificationId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_680af16b67e94e2cb693b9e903" ON "user_notification" ("notificationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_dce2a8927967051c447ae10bc8" ON "user_notification" ("userId") `);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "startTime"`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "endTime"`);
        await queryRunner.query(`ALTER TABLE "project" ADD "projectLead" uuid`);
        await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "UQ_3debb9292d697e6064c9f1c7414" UNIQUE ("projectLead")`);
        await queryRunner.query(`ALTER TABLE "user" ADD "phoneNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "UQ_20f1f21d6853d9d20d501636ebd"`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "task" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "UQ_20f1f21d6853d9d20d501636ebd" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "FK_3debb9292d697e6064c9f1c7414" FOREIGN KEY ("projectLead") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_notification" ADD CONSTRAINT "FK_680af16b67e94e2cb693b9e9033" FOREIGN KEY ("notificationId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_notification" ADD CONSTRAINT "FK_dce2a8927967051c447ae10bc8b" FOREIGN KEY ("userId") REFERENCES "notification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_notification" DROP CONSTRAINT "FK_dce2a8927967051c447ae10bc8b"`);
        await queryRunner.query(`ALTER TABLE "user_notification" DROP CONSTRAINT "FK_680af16b67e94e2cb693b9e9033"`);
        await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "FK_3debb9292d697e6064c9f1c7414"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "UQ_20f1f21d6853d9d20d501636ebd"`);
        await queryRunner.query(`ALTER TABLE "task" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "task" ADD "name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "UQ_20f1f21d6853d9d20d501636ebd" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "UQ_3debb9292d697e6064c9f1c7414"`);
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "projectLead"`);
        await queryRunner.query(`ALTER TABLE "task" ADD "endTime" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "task" ADD "startTime" TIMESTAMP`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dce2a8927967051c447ae10bc8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_680af16b67e94e2cb693b9e903"`);
        await queryRunner.query(`DROP TABLE "user_notification"`);
        await queryRunner.query(`DROP TABLE "notification"`);
    }

}
