// assets/Scripts/Plants/Sunflower.ts

import { _decorator, Component, Node, Animation, Vec3 } from 'cc';
import { SunManager } from '../SunManager'; // 引入上一节写的管理器
const { ccclass, property } = _decorator;

@ccclass('Sunflower')
export class Sunflower extends Component {

    @property(Animation)
    private anim: Animation = null; // 拖入自身的 Animation 组件

    private productionTimer: number = 0;

    // 向日葵生产阳光的间隔 (为了测试可以设短一点，比如5秒，正式游戏是24秒)
    private productionInterval: number =24;

    protected start() {
        // 1. 确保获取了组件
        if (!this.anim) this.anim = this.getComponent(Animation);

        // 2. 播放待机动画
        this.anim.play('Idle');
       
    }

    protected update(dt: number) {
        // 简单的计时器逻辑
        this.productionTimer += dt;

        if (this.productionTimer >= this.productionInterval) {
            this.triggerProduction();
            this.productionTimer = 0; // 重置计时器
        }
    }

    // 触发生产状态（只负责播放动画）
    private triggerProduction() {
        // 切换到生产动画
        this.anim.play('Produce');

        // 监听生产动画结束，切回待机
        this.anim.once(Animation.EventType.FINISHED, () => {
            this.anim.play('Idle');
        }, this);
    }

    /**
     * 【关键】这个方法由动画帧事件自动调用
     * 名字必须和你在动画编辑器里填写的 Function 一模一样
     */
    public spawnSunAnimEvent() {
        console.log("向日葵发光到顶点了，生成太阳！");

        // 调用 SunManager 在当前向日葵的位置生成太阳
        // 获取当前节点的世界坐标
        const worldPos = this.node.worldPosition;

        // 调用 SunManager 单例实例的方法生成太阳
        const sunManager = SunManager.get_instance();
        if (sunManager) {
            sunManager.spawnSunAt(worldPos);
        }
    }
}