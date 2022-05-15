import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Entity, Column } from 'typeorm';

@Entity({ name: 'contract_types' })
export class ContractType extends BaseEntity {
    @Column({ length: 255, nullable: false })
    name: string;

    @Column({ nullable: true })
    expiredIn: number;

    @Column({ nullable: true })
    paidLeaveDays: number;

    @Column({ length: 2000, nullable: true })
    description: string;
}
