import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMsProjectConfig1742454177000 implements MigrationInterface {
    name = 'InitialMsProjectConfig1742454177000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "ms_project_config" (
                "ms_project_config_id" int4 PRIMARY KEY NOT NULL,
                "ms_project_config_name" varchar(255) NULL,
                "ms_project_config_val" varchar(255) NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "ms_project_config"(
                "ms_project_config_id",
                "ms_project_config_name",
                "ms_project_config_val"
            )
            VALUES (
                1,
                'CENTER_AUTH_LOGIN_URL',
                'https://mocha.centerapp.io/center/auth/login'
            ),(
                2,
                'CENTER_AUTH_LOGIN_USERNAME',
                'pmtx-admim@gmail.com'
            ),(
                3,
                'CENTER_AUTH_LOGIN_PASSWORD',
                'P@55w0rD1234'
            ),(
                4,
                'CENTER_API_USERS_ME_URL',
                'https://mocha.centerapp.io/center/api/v1/users/me'
            ),(
                5,
                'KNOWLEDGE_BASE_RUN_URL',
                'https://mlsandbox.oneweb.tech/px/retrieval'
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "ms_project_config" (
                "ms_project_config_id" int4 PRIMARY KEY NOT NULL,
                "ms_project_config_name" varchar(255) NULL,
                "ms_project_config_val" varchar(255) NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "ms_project_config"(
                "ms_project_config_id",
                "ms_project_config_name",
                "ms_project_config_val"
            )
            VALUES (
                1,
                'CENTER_AUTH_LOGIN_URL',
                'https://mocha.centerapp.io/center/auth/login'
            ),(
                2,
                'CENTER_AUTH_LOGIN_USERNAME',
                'pmtx-admim@gmail.com'
            ),(
                3,
                'CENTER_AUTH_LOGIN_PASSWORD',
                'P@55w0rD1234'
            ),(
                4,
                'CENTER_API_USERS_ME_URL',
                'https://mocha.centerapp.io/center/api/v1/users/me'
            ),(
                5,
                'KNOWLEDGE_BASE_RUN_URL',
                'https://mlsandbox.oneweb.tech/px/retrieval'
            )
        `);
    }
}
