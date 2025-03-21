import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectAccessToken1742454177001 implements MigrationInterface {
    name = 'AddProjectAccessToken1742454177001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "project_access_token" (
                "project_id" varchar(255) NULL,
                "access_token" varchar(255) NULL
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "project_access_token" (
                "project_id" varchar(255) NULL,
                "access_token" varchar(255) NULL
            )
        `);
    }
}
