import { Entity, Column } from 'typeorm';
import { BaseEntity } from 'src/common/entities/BaseEntity';

@Entity({ name: 'setting_holidays' })
export class SettingHoliday extends BaseEntity {
    @Column({ length: 255, nullable: false })
    title: string;

    @Column({ length: 255, nullable: false })
    description: string;

    @Column({ type: 'datetime', nullable: false })
    date: Date;
}
