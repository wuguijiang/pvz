// assets/Scripts/Plants/PeaBullet.ts
import { _decorator, Component, Node, Vec3, UITransform, view, Collider2D, Contact2DType, IPhysics2DContact } from 'cc';
import { Zombie } from '../Zombie/Zombie'; //僵尸
const { ccclass, property } = _decorator;

@ccclass('PeaBullet')
export class PeaBullet extends Component {

    // 子弹飞行速度
    @property
    private speed: number = 500;

    @property
    private damage: number = 20; // 子弹伤害

    // 屏幕右边界（用于销毁）
    private rightBorder: number = 0;

    protected start() {
        // 获取屏幕可见区域的宽度作为销毁边界
        const visibleSize = view.getVisibleSize();
        this.rightBorder = visibleSize.width / 2 + 100; // 稍微宽一点

        //注册碰撞
        const collider = this.getComponent(Collider2D);
        
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);  
             collider.group = 2;
        }
    }

    protected update(dt: number) {
        // 1. 每帧向右移动
        const currentPos = this.node.position;
        // 这里的 x 轴方向取决于你的根节点设计，通常向右是 x+
        this.node.setPosition(currentPos.x + this.speed * dt, currentPos.y, currentPos.z);

        // 2. 飞出屏幕销毁
        // 注意：这里用世界坐标或者相对于Canvas的坐标判断更准确
        // 简单判断：如果局部坐标 x 很大了就销毁
        if (this.node.position.x > this.rightBorder) {
            this.node.destroy();
        }
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
          const zombie = otherCollider.node.getComponent(Zombie);
          if (zombie) {
               zombie.takeDamage(this.damage);
               this.node.destroy(); 
          }
    }

}