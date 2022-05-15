import { BaseEntity } from 'src/common/entities/BaseEntity';
import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity({ name: 'user_timekeeping_histories' })
export class UserTimekeepingHistory extends BaseEntity {
    @Column({
        nullable: true,
    })
    @Index()
    userId: number;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({
        name: 'userId',
    })
    user: User;

    @Column({ nullable: true })
    month: number;

    @Column({ nullable: true })
    year: number;

    @Column({ nullable: true })
    paidLeaveHoursLeft: number;

    @Column({ nullable: true })
    paidLeaveHoursUsed: number;
}
