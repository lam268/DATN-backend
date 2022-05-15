import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { RequestAbsenceStatus } from '../requestAbsence.constant';
@Entity({ name: 'request_absences' })
export class RequestAbsence extends BaseEntity {
    @Column({ nullable: false })
    @Index()
    userId: number;

    @Column({ nullable: true, length: 2000 })
    reason: string;

    @Column({
        type: 'enum',
        enum: RequestAbsenceStatus,
        nullable: false,
        default: RequestAbsenceStatus.WAITING,
    })
    status: RequestAbsenceStatus;

    @Column({ nullable: false, type: 'timestamp' })
    startAt: Date;

    @Column({ nullable: true, type: 'timestamp' })
    endAt: Date;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({
        name: 'userId',
    })
    user: User;

    avatarInfo: Record<string, string>;
}
