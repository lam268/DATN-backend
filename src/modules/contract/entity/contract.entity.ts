import { BaseEntity } from 'src/common/entities/BaseEntity';
import { ContractType } from 'src/modules/setting/entity/contract-type.entity';
import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { ContractStatus } from '../contract.constant';

@Entity({ name: 'contracts' })
export class Contract extends BaseEntity {
    @Column({
        name: 'userId',
    })
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({
        name: 'userId',
    })
    user: User;

    @Column({
        type: 'int',
        nullable: true,
    })
    contractTypeId: number;

    @ManyToOne(() => ContractType)
    @JoinColumn({
        name: 'contractTypeId',
    })
    contractType: ContractType;

    @Column({
        type: 'enum',
        enum: ContractStatus,
        nullable: true,
    })
    status: ContractStatus;

    @Column({ type: 'datetime' })
    startDate: Date;

    @Column({ type: 'datetime' })
    endDate: Date;

    @Column({ type: 'datetime' })
    stopDate: Date;

    @Column()
    url: string;
}
