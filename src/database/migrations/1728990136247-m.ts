import {MigrationInterface, QueryRunner} from "typeorm";

export class m1728990136247 implements MigrationInterface {
    name = 'm1728990136247'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permission" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "resource" character varying(100) NOT NULL, "description" character varying NOT NULL, "path" character varying NOT NULL, "method" character varying(20) NOT NULL DEFAULT 'get', "isDefault" boolean NOT NULL, CONSTRAINT "UQ_b690135d86d59cc689d465ac952" UNIQUE ("description"), CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b690135d86d59cc689d465ac95" ON "permission" ("description") `);
        await queryRunner.query(`CREATE TABLE "role" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "description" character varying NOT NULL, CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_profile_department_enum" AS ENUM('operations', 'accounts', 'administration')`);
        await queryRunner.query(`CREATE TYPE "public"."user_profile_bloodgroup_enum" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`);
        await queryRunner.query(`CREATE TYPE "public"."user_profile_maritalstatus_enum" AS ENUM('single', 'married', 'divorced', 'widowed')`);
        await queryRunner.query(`CREATE TYPE "public"."user_profile_gender_enum" AS ENUM('male', 'female')`);
        await queryRunner.query(`CREATE TYPE "public"."user_profile_taxcalculation_enum" AS ENUM('single_assessee', 'couple_assessees')`);
        await queryRunner.query(`CREATE TABLE "user_profile" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "department" "public"."user_profile_department_enum" NOT NULL, "location" character varying(100) NOT NULL, "bloodGroup" "public"."user_profile_bloodgroup_enum", "maritalStatus" "public"."user_profile_maritalstatus_enum", "gender" "public"."user_profile_gender_enum", "taxCalculation" "public"."user_profile_taxcalculation_enum", "panNo" character varying(15) NOT NULL, "permanentAddressCountry" character varying(100) NOT NULL, "permanentAddressState" character varying(100) NOT NULL, "permanentAddressDistrict" character varying(100) NOT NULL, "permanentAddressLocalJurisdiction" character varying(100) NOT NULL, "permanentAddressWardNo" character varying(10) NOT NULL, "permanentAddressLocality" character varying(100) NOT NULL, "temporaryAddressCountry" character varying(100) NOT NULL, "temporaryAddressState" character varying(100) NOT NULL, "temporaryAddressDistrict" character varying(100) NOT NULL, "temporaryAddressLocalJurisdiction" character varying(100) NOT NULL, "temporaryAddressWardNo" character varying(10) NOT NULL, "temporaryAddressLocality" character varying(100) NOT NULL, "guardianName" character varying(100) NOT NULL, "guardianRelation" character varying(50) NOT NULL, "guardianContact" character varying(15) NOT NULL, "contactNo" character varying(15) NOT NULL, "alternateContactNo" character varying(15), "personalEmail" character varying(254) NOT NULL, "casualLeaves" integer NOT NULL DEFAULT '0', "examLeaves" integer NOT NULL DEFAULT '0', "maternityLeaves" integer NOT NULL DEFAULT '0', "paternityLeaves" integer NOT NULL DEFAULT '0', "otherLeaves" integer NOT NULL DEFAULT '0', "pf" boolean NOT NULL DEFAULT false, "hourlyCostRate" double precision NOT NULL DEFAULT '0', "publicHolidayAllowance" double precision NOT NULL DEFAULT '0', "userId" integer, CONSTRAINT "UQ_282ad1dd8cfe8d0b89ca6c96a94" UNIQUE ("panNo"), CONSTRAINT "PK_f44d0cd18cfd80b0fed7806c3b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_bank_detail" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "bankName" character varying(100) NOT NULL, "bankBranch" character varying(100) NOT NULL, "accountNo" character varying(20) NOT NULL, "documentFile" character varying, "userId" integer, CONSTRAINT "PK_5aa4e921201c1e9c89b0bc94b03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_document_documenttype_enum" AS ENUM('citizenship', 'passport', 'driving_license', 'pan_no', 'membership', 'others')`);
        await queryRunner.query(`CREATE TABLE "user_document" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "documentType" "public"."user_document_documenttype_enum" NOT NULL, "identificationNo" character varying(50) NOT NULL, "dateOfIssue" date NOT NULL, "placeOfIssue" character varying(100) NOT NULL, "documentFile" character varying, "userId" integer, CONSTRAINT "PK_18a41ed5aafb9732cfa62c8debd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" text NOT NULL, "status" character varying(20) NOT NULL, "natureOfWork" character varying(30) NOT NULL, "fiscalYear" integer NOT NULL, "startingDate" date NOT NULL, "endingDate" date NOT NULL, CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task_group" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" text, "tasksId" integer, CONSTRAINT "PK_465a127df1ace09f377dd2eef6f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" text, "startTime" TIMESTAMP, "endTime" TIMESTAMP, "dueDate" TIMESTAMP, "reporterId" integer NOT NULL, "groupId" integer, "projectId" integer, "parentTaskId" integer, CONSTRAINT "UQ_20f1f21d6853d9d20d501636ebd" UNIQUE ("name"), CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "username" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "avatar" character varying, "status" character varying NOT NULL, "token" character varying, "tokenValidityDate" TIMESTAMP NOT NULL DEFAULT now(), "salt" character varying NOT NULL, "twoFASecret" character varying, "twoFAThrottleTime" TIMESTAMP NOT NULL DEFAULT now(), "isTwoFAEnabled" boolean NOT NULL DEFAULT false, "roleId" integer NOT NULL, CONSTRAINT "REL_c28e52f758e7bbc53828db9219" UNIQUE ("roleId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "user" ("username") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_065d4d8f3b5adb4a08841eae3c" ON "user" ("name") `);
        await queryRunner.query(`CREATE TABLE "email_templates" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "slug" character varying NOT NULL, "sender" character varying NOT NULL, "subject" character varying NOT NULL, "body" character varying NOT NULL, "isDefault" boolean NOT NULL, CONSTRAINT "PK_06c564c515d8cdb40b6f3bfbbb4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4d77a74e85c275da60f4badf83" ON "email_templates" ("title") `);
        await queryRunner.query(`CREATE TABLE "refresh_token" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "ip" character varying NOT NULL, "userAgent" character varying NOT NULL, "browser" character varying, "os" character varying, "isRevoked" boolean NOT NULL, "expires" TIMESTAMP NOT NULL, CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_192c36a5937bf5eeb9de99290b" ON "refresh_token" ("browser") `);
        await queryRunner.query(`CREATE INDEX "IDX_cbf62122e9f9d90ecad419d49f" ON "refresh_token" ("os") `);
        await queryRunner.query(`CREATE TABLE "role_permission" ("roleId" integer NOT NULL, "permissionId" integer NOT NULL, CONSTRAINT "PK_b42bbacb8402c353df822432544" PRIMARY KEY ("roleId", "permissionId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e3130a39c1e4a740d044e68573" ON "role_permission" ("roleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_72e80be86cab0e93e67ed1a7a9" ON "role_permission" ("permissionId") `);
        await queryRunner.query(`CREATE TABLE "user_tasks" ("taskId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_07df033b0b61ee58ded3168bf2a" PRIMARY KEY ("taskId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_eff2f1ef189a7952bc6294a1da" ON "user_tasks" ("taskId") `);
        await queryRunner.query(`CREATE INDEX "IDX_83e94423ca0675e4ac503d8641" ON "user_tasks" ("userId") `);
        await queryRunner.query(`CREATE TABLE "user_project" ("projectId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_2a37107e0b3bdb06b4920a64bbc" PRIMARY KEY ("projectId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cb5415b5e54f476329451212e9" ON "user_project" ("projectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b88a18e4faeea3bce60d70a4ae" ON "user_project" ("userId") `);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "FK_51cb79b5555effaf7d69ba1cff9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_bank_detail" ADD CONSTRAINT "FK_474450ce7e9d209ced1ca799cd0" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_document" ADD CONSTRAINT "FK_bea6ff5b6ea0d461a438a2e837c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_group" ADD CONSTRAINT "FK_9f422b1eb79d9d30ce680809556" FOREIGN KEY ("tasksId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_d7263b567c2d0945fd5aa9ab671" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_b8e1728a46f2cbb7b937011ae4f" FOREIGN KEY ("groupId") REFERENCES "task_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_3797a20ef5553ae87af126bc2fe" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_8bf6d736c49d48d91691ea0dfe5" FOREIGN KEY ("parentTaskId") REFERENCES "task"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permission" ADD CONSTRAINT "FK_e3130a39c1e4a740d044e685730" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permission" ADD CONSTRAINT "FK_72e80be86cab0e93e67ed1a7a9a" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_tasks" ADD CONSTRAINT "FK_eff2f1ef189a7952bc6294a1da5" FOREIGN KEY ("taskId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_tasks" ADD CONSTRAINT "FK_83e94423ca0675e4ac503d86413" FOREIGN KEY ("userId") REFERENCES "task"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_project" ADD CONSTRAINT "FK_cb5415b5e54f476329451212e9b" FOREIGN KEY ("projectId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_project" ADD CONSTRAINT "FK_b88a18e4faeea3bce60d70a4ae3" FOREIGN KEY ("userId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_project" DROP CONSTRAINT "FK_b88a18e4faeea3bce60d70a4ae3"`);
        await queryRunner.query(`ALTER TABLE "user_project" DROP CONSTRAINT "FK_cb5415b5e54f476329451212e9b"`);
        await queryRunner.query(`ALTER TABLE "user_tasks" DROP CONSTRAINT "FK_83e94423ca0675e4ac503d86413"`);
        await queryRunner.query(`ALTER TABLE "user_tasks" DROP CONSTRAINT "FK_eff2f1ef189a7952bc6294a1da5"`);
        await queryRunner.query(`ALTER TABLE "role_permission" DROP CONSTRAINT "FK_72e80be86cab0e93e67ed1a7a9a"`);
        await queryRunner.query(`ALTER TABLE "role_permission" DROP CONSTRAINT "FK_e3130a39c1e4a740d044e685730"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_c28e52f758e7bbc53828db92194"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_8bf6d736c49d48d91691ea0dfe5"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_3797a20ef5553ae87af126bc2fe"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_b8e1728a46f2cbb7b937011ae4f"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_d7263b567c2d0945fd5aa9ab671"`);
        await queryRunner.query(`ALTER TABLE "task_group" DROP CONSTRAINT "FK_9f422b1eb79d9d30ce680809556"`);
        await queryRunner.query(`ALTER TABLE "user_document" DROP CONSTRAINT "FK_bea6ff5b6ea0d461a438a2e837c"`);
        await queryRunner.query(`ALTER TABLE "user_bank_detail" DROP CONSTRAINT "FK_474450ce7e9d209ced1ca799cd0"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT "FK_51cb79b5555effaf7d69ba1cff9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b88a18e4faeea3bce60d70a4ae"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cb5415b5e54f476329451212e9"`);
        await queryRunner.query(`DROP TABLE "user_project"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_83e94423ca0675e4ac503d8641"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eff2f1ef189a7952bc6294a1da"`);
        await queryRunner.query(`DROP TABLE "user_tasks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_72e80be86cab0e93e67ed1a7a9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e3130a39c1e4a740d044e68573"`);
        await queryRunner.query(`DROP TABLE "role_permission"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cbf62122e9f9d90ecad419d49f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_192c36a5937bf5eeb9de99290b"`);
        await queryRunner.query(`DROP TABLE "refresh_token"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4d77a74e85c275da60f4badf83"`);
        await queryRunner.query(`DROP TABLE "email_templates"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_065d4d8f3b5adb4a08841eae3c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e12875dfb3b1d92d7d7c5377e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78a916df40e02a9deb1c4b75ed"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "task"`);
        await queryRunner.query(`DROP TABLE "task_group"`);
        await queryRunner.query(`DROP TABLE "project"`);
        await queryRunner.query(`DROP TABLE "user_document"`);
        await queryRunner.query(`DROP TYPE "public"."user_document_documenttype_enum"`);
        await queryRunner.query(`DROP TABLE "user_bank_detail"`);
        await queryRunner.query(`DROP TABLE "user_profile"`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_taxcalculation_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_maritalstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_bloodgroup_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_department_enum"`);
        await queryRunner.query(`DROP TABLE "role"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b690135d86d59cc689d465ac95"`);
        await queryRunner.query(`DROP TABLE "permission"`);
    }

}
