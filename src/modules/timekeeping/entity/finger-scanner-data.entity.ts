import { BaseEntity } from 'src/common/entities/BaseEntity';
import {
    Entity,
    Column,
    CreateDateColumn,
    JoinColumn,
    ManyToOne,
    Index,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity({ name: 'finger_scanner_data' })
export class FingerScannerData extends BaseEntity {
    @Column({
        nullable: true,
    })
    @Index()
    username: string;

    @CreateDateColumn({ type: 'timestamp' })
    scanAt: Date;

    @Column({
        nullable: true,
    })
    @Index()
    userId: number;

    @Column({
        nullable: true,
    })
    @Index()
    fingerId: number;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({
        name: 'userId',
    })
    user: User;
}
