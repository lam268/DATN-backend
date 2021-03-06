import { Province } from 'src/modules/user/entity/province.entity';
import { Role } from '../../role/entity/role.entity';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    BeforeInsert,
    BeforeUpdate,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { UserStatus, UserGender } from '../user.constant';

import * as bcrypt from 'bcrypt';
import { BaseEntity } from 'src/common/entities/BaseEntity';
import { RequestAbsence } from 'src/modules/request-absence/entity/request-absences.entity';
import { UserTimekeepingHistory } from 'src/modules/timekeeping/entity/user-timekeeping-history.entity';
import { ContractType } from 'src/modules/setting/entity/contract-type.entity';
import { ITimekeeping } from 'src/modules/timekeeping/timekeeping.interface';
@Entity({ name: 'users' })
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    roleId: number;

    @Column({ default: null })
    provinceId: number;

    @Column({ nullable: false })
    position: string;

    @Column({ length: 255, nullable: false })
    email: string;

    @Column({ length: 255, nullable: true })
    password: string;

    @Column({ length: 255, nullable: false })
    fullName: string;

    @Column({ type: 'datetime', nullable: true })
    birthday: Date;

    @Column({ length: 255, nullable: true })
    phoneNumber: string;

    @Column({ length: 2000, nullable: true })
    address: string;

    @Column({ length: 2000, nullable: true })
    hometownAddress: string;

    @Column({ length: 2000, nullable: true })
    note: string;

    @Column({
        type: 'enum',
        enum: UserGender,
        nullable: true,
    })
    gender: UserGender;

    @ManyToOne(() => Role)
    @JoinColumn({
        name: 'roleId',
    })
    role: Role;

    @ManyToOne(() => Province)
    @JoinColumn({
        name: 'provinceId',
    })
    province: Province;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.WAITING_FOR_APPROVAL,
    })
    status: UserStatus;

    @Column({ type: 'timestamp', nullable: true })
    lastLoginAt: Date;

    @Column({ type: String, nullable: true })
    taxCode: string;

    @Column({ type: String, nullable: true })
    socialInsurance: string;

    @Column({ type: String, nullable: true })
    bank: string;

    @Column({ type: String, nullable: true })
    bankAccount: string;

    @Column({ type: String, nullable: true })
    citizenId: string;

    @CreateDateColumn({ type: 'timestamp' })
    citizenIdIssuedAt: Date;

    @Column({ nullable: true })
    avatarId: number;

    @Column({
        name: 'idCardIssuePlace',
        nullable: true,
    })
    idCardIssuePlace: string;

    @Column({
        name: 'isSuperAdmin',
        default: false,
    })
    isSuperAdmin: boolean;

    @BeforeInsert()
    @BeforeUpdate()
    hashPassword() {
        if (this.password) {
            this.password = bcrypt.hashSync(
                this.password,
                bcrypt.genSaltSync(10),
            );
        }
    }

    async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }

    avatar: Record<string, string>;

    timekeepings: ITimekeeping[];

    requestAbsences: RequestAbsence[];

    timekeepingHistory: UserTimekeepingHistory;

    contractType: ContractType;
}
