import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSelfReportType1660393457470 implements MigrationInterface {
    name = 'AddSelfReportType1660393457470';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`match\` ADD \`selfReportKey\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`match\` DROP COLUMN \`selfReportKey\``);
    }
}
