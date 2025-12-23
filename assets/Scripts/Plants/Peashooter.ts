// assets/Scripts/Plants/Peashooter.ts

import { _decorator, Component, Node, Animation, Prefab, instantiate, UITransform, Vec3, director, Collider2D } from 'cc';
// 引入子弹脚本（如果需要引用类型，不需要可以不引）
import { PeaBullet } from './PeaBullet'; 
const { ccclass, property } = _decorator;

@ccclass('Peashooter')
export class Peashooter extends Component {

    @property(Animation)
    private anim: Animation = null;

    @property({ type: Prefab, tooltip: "豌豆子弹的预制体" })
    private bulletPrefab: Prefab = null;

    @property({ type: Node, tooltip: "子弹发射点（嘴巴位置的空节点）" })
    private shootPoint: Node = null;

    private attackTimer: number = 0;
    // 攻击间隔 (例如 1.4秒发射一次)
    private attackInterval: number = 1.4;

    protected start() {
          // 获取碰撞体组件
        const collider = this.getComponent(Collider2D);
          if (collider) {
           
            collider.group = 1;
            }

        if (!this.anim) this.anim = this.getComponent(Animation);
        
        // 默认播放待机
        this.anim.play('Idle');
        
        // 如果没有设置发射点，默认就用当前植物的位置，但最好在编辑器里设置一个子节点
        if (!this.shootPoint) {
            this.shootPoint = this.node; 
        }
    }

    protected update(dt: number) {
        this.attackTimer += dt;

        // 这里有个优化点：
        // 真正的 pvz 只有这行有僵尸时才发射。
        // 目前为了测试，我们先像向日葵一样，时间到了就发射。
        if (this.attackTimer >= this.attackInterval) {
            this.triggerAttack();
            this.attackTimer = 0;
        }
    }

    // 触发攻击状态（播放动画）
    private triggerAttack() {
        // 播放攻击动画
        this.anim.play('Attack');

        // 监听动画结束，切回待机（跟你的向日葵写法一样）
        this.anim.once(Animation.EventType.FINISHED, () => {
            this.anim.play('Idle');
        }, this);
    }

    /**
     * 【关键】动画帧事件：发射豌豆
     * 必须在动画编辑器里，把 Attack 动画的某一帧（头伸出去那帧）绑定这个函数
     */
    public firePeaAnimEvent() {
        // console.log("豌豆射手发射子弹！");
        if (!this.bulletPrefab) {
            console.error("未设置子弹预制体！");
            return;
        }

        this.spawnBullet();
    }

    private spawnBullet() {
        // 1. 实例化子弹
        const bullet = instantiate(this.bulletPrefab);

        // 2. 确定子弹的父节点
        // 重点：子弹不能作为植物的子节点！因为植物可能被铲除，且植物层级可能比较深。
        // 最好把子弹放到一个全局的 "BulletLayer" 或者直接放到 Canvas/Root 下。
        // 简单做法：找到场景的根节点或者特定的容器
        let bulletParent = this.node.parent; 
        // 为了防止植物透明度影响子弹，或者层级问题，建议往上找，比如和 PlantsLayer 同级的节点
        // 这里假设我们先加到和植物同一层，或者你可以创建一个专门的 BulletLayer 传进来
        if (bulletParent) {
            bulletParent.addChild(bullet);
        }

        // 3. 设置坐标（核心：坐标转换）
        // 获取发射点的世界坐标
        const worldPos = this.shootPoint.getComponent(UITransform).convertToWorldSpaceAR(new Vec3(0, 0, 0));
        
        // 将世界坐标转换为父节点（bulletParent）的局部坐标
        const localPos = bulletParent.getComponent(UITransform).convertToNodeSpaceAR(worldPos);

        bullet.setPosition(localPos);
    }
}