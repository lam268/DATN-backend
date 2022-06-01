import { BaseEntity } from 'src/common/entities/BaseEntity';
import {
    Entity,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity({ name: 'timekeepings' })
export class Timekeeping extends BaseEntity {
    @Column({
        nullable: true,
    })
    @Index()
    userId: number;

    @CreateDateColumn({ type: 'timestamp' })
    checkIn: string;

    @CreateDateColumn({ type: 'timestamp' })
    checkOut: string;

    @CreateDateColumn({ type: 'timestamp' })
    scanAt: Date;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({
        name: 'userId',
    })
    user: User;
}
