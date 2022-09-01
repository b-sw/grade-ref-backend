import {MigrationInterface, QueryRunner} from "typeorm";

export class VideoClip1662064643486 implements MigrationInterface {
    name = 'VideoClip1662064643486'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`video_clip\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`matchId\` varchar(255) NOT NULL, \`uploadDate\` datetime NULL, \`path\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`video_clip\` ADD CONSTRAINT \`FK_d42cc0ed035ea8e4bc35763776f\` FOREIGN KEY (\`matchId\`) REFERENCES \`match\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`video_clip\` DROP FOREIGN KEY \`FK_d42cc0ed035ea8e4bc35763776f\``);
        await queryRunner.query(`DROP TABLE \`video_clip\``);
    }

}
