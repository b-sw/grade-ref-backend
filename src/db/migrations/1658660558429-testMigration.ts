import {MigrationInterface, QueryRunner} from "typeorm";

export class testMigration1658660558429 implements MigrationInterface {
    name = 'testMigration1658660558429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`foul\` ADD \`testColumn\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`foul\` DROP COLUMN \`testColumn\``);
    }

}
