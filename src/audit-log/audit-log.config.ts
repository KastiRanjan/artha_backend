import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Check whether audit logging is enabled via environment variable.
 * Must be explicitly set to 'true' or '1' in the backend .env.
 * If false/unset, no database connection will be made, and no events will be tracked.
 */
export function isAuditLogEnabled(): boolean {
  return (
    process.env.AUDIT_LOG_ENABLED === 'true' ||
    process.env.AUDIT_LOG_ENABLED === '1'
  );
}

/**
 * Audit Log Configuration
 *
 * Defines which tables should be audited and which should be skipped.
 *
 * AUDITED TABLES (system/configuration tables with critical business data):
 * These tables contain sensitive or important data where tracking changes
 * is essential for compliance, debugging, and accountability.
 *
 * SKIPPED TABLES (high-volume, ephemeral, or inherently log-like data):
 * These tables either already serve as logs, change too frequently,
 * or contain transient data that doesn't need audit tracking.
 */

/**
 * Tables that should SKIP audit logging.
 *
 * Rationale for each exclusion:
 *
 * - refresh_token: Ephemeral session tokens; constantly created/revoked. Already a security log itself.
 * - notification: System-generated, read-only messages. High volume, no user edits.
 * - user_notification: Join table marking read/unread. Extremely high volume, low value.
 * - attendancehistory: Already IS a history/log table for attendance clock-out changes.
 * - attendance_reminder_logs: Already IS a log table for reminder emails sent.
 * - worklogs: High-volume daily entries (every user, every day). Has its own approval workflow.
 *            Auditing these would flood the audit DB. Worklogs already track their own status changes.
 * - workhour: Tracks daily work hours derived from attendance. High volume, computed data.
 * - workhour_history: Already IS a history table.
 * - user_history: Already IS a history table tracking user profile changes.
 * - migrations: TypeORM internal table.
 * - query-result-cache: TypeORM internal table.
 * - task_user: ManyToMany join table for task assignments. Very high volume.
 * - user_project: ManyToMany join table for project assignments. High volume.
 * - role_permission: ManyToMany join table. Changes are covered by role audit.
 * - dashboard: Read-only computed/aggregated data, no meaningful edits (not even a real table).
 * - calendar: Derived from holidays/leaves, no direct user edits of high business impact.
 */
export const AUDIT_SKIP_TABLES: string[] = [
  // Ephemeral / session tables
  'refresh_token',

  // Already log/history tables (auditing logs is redundant)
  'attendancehistory',
  'attendance_reminder_logs',
  'workhour_history',
  'user_history',

  // High-volume operational data
  'notification',
  'user_notification',
  'worklogs',
  'workhour',

  // TypeORM internals
  'migrations',
  'query-result-cache',

  // ManyToMany join tables (changes tracked via parent entities)
  'task_user',
  'user_project',
  'role_permission',

  // Derived / read-only data
  'dashboard',
  'calendar',
];

/**
 * Tables that SHOULD be audited.
 *
 * These are system/configuration tables where every change matters.
 * Table names match the actual PostgreSQL table names created by TypeORM.
 *
 * IDENTITY & ACCESS CONTROL:
 * - user: Core user accounts — name, email, role, status, hourlyRate changes
 * - role: Role definitions — any role change affects all users in that role
 * - permission: Permission definitions — security-critical
 *
 * HR & PEOPLE:
 * - user_profiles: Employee personal data (PII — DOB, emergency contacts, PAN)
 * - user_bank_details: Financial data — extremely sensitive
 * - user_contract_documents: Employment contracts and NDA documents
 * - user_documents: Uploaded employee KYC/identification documents
 * - user_education_details: Education records
 * - user_training_certificates: Training/certification records
 * - leaves: Leave requests and approvals — affects payroll
 * - leavetype: Leave policy definitions (sick, casual, maternity, etc.)
 * - leave_balance_ledgers: Leave balance adjustments — financial impact
 * - user_leave_balances: Leave balance records per user
 * - attendance: Clock in/out records — affects payroll
 * - holiday: Holiday calendar — affects all employees
 *
 * CLIENT & BUSINESS:
 * - customer: Client company records — critical business data
 * - boardmember: Client board members
 * - managementteammember: Client management contacts
 * - registrationandlicense: Client regulatory data
 * - portalcredential: Client portal access credentials — security sensitive
 * - otherimportantinfo: Supplementary client data (contact persons)
 * - billing: Billing entity configurations — financial (PAN, VAT, bank accounts)
 *
 * PROJECT & TASK MANAGEMENT:
 * - projects: Project definitions and settings
 * - project_timelines: Project milestone dates
 * - project_user_assignments: Who is assigned to what project (with role)
 * - tasks: Tasks — status, assignment, priority changes
 * - task_groups: Task grouping configuration
 * - task_group_projects: Task group to project mappings
 * - task_supers: Super task / category definitions
 * - task_super_projects: Super task to project mappings
 * - task_templates: Reusable task templates
 * - task_types: Task type definitions
 * - todo_tasks: Personal todo items
 * - todo_task_titles: Todo list definitions
 * - project_evaluations: Project evaluations/reviews
 * - project_signoffs: Project signoff records — contractual significance
 *
 * SYSTEM CONFIGURATION:
 * - natureofwork: Work classification types
 * - natureofworkgroup: Work classification groups
 * - businesssize: Business size categories
 * - businessnature: Business nature/industry types
 * - legalstatus: Legal entity classifications
 * - department: Department structure
 * - emailtemplate: Email template content
 * - mail_settings: SMTP and mail configuration — system critical
 * - noticeboard: Company announcements
 *
 * DSA & EXPENSES:
 * - dsa: Daily Subsistence Allowance records
 * - dsa_expense_items: Individual expense line items
 *
 * CLIENT REPORTS:
 * - client_reports: Client report definitions
 * - client_report_files: Report file attachments
 * - client_users: Client portal user mappings
 * - client_report_document_types: Report document type definitions
 */
export const AUDIT_TABLES: string[] = [
  // Identity & Access Control
  'user',
  'role',
  'permission',

  // HR & People
  'user_profiles',
  'user_bank_details',
  'user_contract_documents',
  'user_documents',
  'user_education_details',
  'user_training_certificates',
  'leaves',
  'leavetype',
  'leave_balance_ledgers',
  'user_leave_balances',
  'attendance',
  'holiday',

  // Client & Business
  'customer',
  'boardmember',
  'managementteammember',
  'registrationandlicense',
  'portalcredential',
  'otherimportantinfo',
  'billing',

  // Project & Task Management
  'projects',
  'project_timelines',
  'project_user_assignments',
  'tasks',
  'task_groups',
  'task_group_projects',
  'task_supers',
  'task_super_projects',
  'task_templates',
  'task_types',
  'todo_tasks',
  'todo_task_titles',
  'project_evaluations',
  'project_signoffs',

  // System Configuration
  'natureofwork',
  'natureofworkgroup',
  'businesssize',
  'businessnature',
  'legalstatus',
  'department',
  'emailtemplate',
  'mail_settings',
  'noticeboard',

  // DSA & Expenses
  'dsa',
  'dsa_expense_items',

  // Client Reports
  'client_reports',
  'client_report_files',
  'client_users',
  'client_report_document_types',
];

/**
 * Fields that should be redacted from audit logs for security/privacy.
 * Values will be stored as '[REDACTED]' instead of the actual value.
 */
export const AUDIT_REDACTED_FIELDS: string[] = [
  'password',
  'salt',
  'token',
  'twoFASecret',
  'twoFAThrottleTime',
];

/**
 * Check if a table should be audited
 */
export function shouldAuditTable(tableName: string): boolean {
  // Normalize the table name (TypeORM sometimes adds schema prefix)
  const normalizedName = tableName.replace(/^public\./, '').toLowerCase();

  // If it's explicitly in the skip list, don't audit
  if (AUDIT_SKIP_TABLES.map(t => t.toLowerCase()).includes(normalizedName)) {
    return false;
  }

  // If it's explicitly in the audit list, audit it
  if (AUDIT_TABLES.map(t => t.toLowerCase()).includes(normalizedName)) {
    return true;
  }

  // Default: don't audit unknown tables (safe default)
  return false;
}

/**
 * Redact sensitive fields from an object
 */
export function redactSensitiveFields(
  obj: Record<string, any> | null
): Record<string, any> | null {
  if (!obj) return null;

  const redacted = { ...obj };
  for (const field of AUDIT_REDACTED_FIELDS) {
    if (field in redacted && redacted[field] !== undefined && redacted[field] !== null) {
      redacted[field] = '[REDACTED]';
    }
  }
  return redacted;
}
