// assets/Scripts/Zombies/Zombie.ts僵尸脚本

import { _decorator, Component, Node, Animation, Vec3, Collider2D, Contact2DType, IPhysics2DContact, RigidBody2D, Sprite, Color } from 'cc';
const { ccclass, property } = _decorator;
// 定义僵尸的状态
enum ZombieState {
    Walk, //走
    Eat,//吃
    Die//死
}
@ccclass('Zombie')
export class Zombie extends Component {
    @property(Animation)
    private anim: Animation = null;

    @property
    private maxHp: number = 100; // 僵尸总血量
    private currentHp: number = 0; //当前生命

    @property
    private moveSpeed: number = 20; // 移动速度（像素/秒）

    @property
    private attackDamage: number = 100; // 啃食伤害（每秒）

    private state: ZombieState = ZombieState.Walk;//走路
    private targetPlant: Node = null; // 当前正在啃的植物

    protected start() {
        this.currentHp = this.maxHp;
        if (!this.anim) this.anim = this.getComponent(Animation);
        //播放走路动画
        this.changeState(ZombieState.Walk);
        //注册碰撞事件
        const collider = this.getComponent(Collider2D);
        if (collider) {
            // 监听开始碰撞
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            // 监听碰撞结束（植物死了或者被铲除）
            collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        }
    }

    protected update(dt: number) {
        //只有在走路时才移动
        if (this.state === ZombieState.Walk) {
            const currentPos = this.node.position;
            // 向左移动 (x 减小)
            this.node.setPosition(currentPos.x - this.moveSpeed * dt, currentPos.y, currentPos.z);
            // 走到屏幕最左边结束游戏逻辑（这里先简单销毁）
            if (currentPos.x < -600) { // 根据你屏幕宽度调整
                this.node.destroy();
            }
        }
        // 啃食逻辑
        if (this.state === ZombieState.Eat && this.targetPlant) {
            //调用植物扣血的逻辑（待会补充）

            if (!this.targetPlant.isValid) {
                this.resumeWalk();
            }

        }
    }
    //状态转换辅助函数
    private changeState(newState: ZombieState) {
        if (this.state === newState) return;
        this.state = newState;
        switch (newState) {
            case ZombieState.Walk:
                this.anim.play('Walk');
                break;
            case ZombieState.Eat:
                this.anim.play('Eat');
                break;
            case ZombieState.Die:
                this.anim.play('Die');
                // 禁用碰撞体，防止死的时候还能挡子弹
                const collider = this.getComponent(Collider2D);
                if (collider) collider.enabled = false;
                break;
        }

    }

    //碰撞回调
    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if (this.state === ZombieState.Die) return;
        console.log("otherCollider.group" + otherCollider.group);
        //碰到植物，停下，开始吃、
        if (otherCollider.group === 1) {
            console.log("僵尸碰到了植物，开始吃！");
            this.targetPlant = otherCollider.node;
           this.scheduleOnce(() => {
            this.changeState(ZombieState.Eat);
        }, 0);
        }
        //子弹 ，用子弹去碰僵尸，然后再调用僵尸的扣血逻辑

    }
    private onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if (otherCollider.node === this.targetPlant) {
            console.log("植物没了，僵尸继续走");
            this.targetPlant = null;
            this.resumeWalk(); // 恢复走路
        }
    }
    //恢复走路
    private resumeWalk() {
        if (this.state !== ZombieState.Die) {
            this.changeState(ZombieState.Walk);
        }
    }

    //公共方法 扣血
    public takeDamage(amount: number) {
        if (this.state === ZombieState.Die) return;
        this.currentHp -= amount
        console.log(`僵尸剩余血量: ${this.currentHp}`);
        // 变红效果（可选）
        const sprite = this.getComponentInChildren(Sprite); // 如果有Sprite
        if (sprite) sprite.color = Color.RED;
        this.scheduleOnce(() => { if (sprite) sprite.color = Color.WHITE }, 0.1);

        if (this.currentHp <= 0) {
            this.die();
        }
    }

    // 死亡逻辑
    private die() {
        console.log("僵尸死亡！");
        this.changeState(ZombieState.Die);
        this.anim.once(Animation.EventType.FINISHED, () => {
            this.node.destroy();
        }, this);
    }
}