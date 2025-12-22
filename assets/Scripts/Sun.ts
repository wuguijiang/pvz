// assets/Scripts/Sun.ts
import { _decorator, Component, Node, Vec3, tween, UIOpacity, UITransform, Animation } from 'cc';
import { SunManager } from './SunManager';
const { ccclass, property } = _decorator;

@ccclass('Sun')
export class Sun extends Component {
    //阳光存在的时间
    private lifeTime: number = 10;
    private isCollected: boolean = false;//判断玩家是否点击
    private sunManage: SunManager = null;
    // 在类中获取 Animation 组件
    private sunAnimation: Animation = null;

    //目标位置(卡片栏的太阳图标)
    private uiTargetPos: Vec3 = new Vec3();

    //初始化方法（由Manager调用）
    public init(manager: SunManager, targetPos: Vec3) {
        // 清理之前的状态
        this.cleanup();
        this.sunManage = manager;
        this.uiTargetPos = targetPos;
        this.isCollected = false;
        this.sunAnimation = this.getComponent(Animation);
        this.playSunAnimation();


        //重置透明度和缩放（为了对象池复用）
        let opacityComp = this.getComponent(UIOpacity);
        if (!opacityComp) opacityComp = this.addComponent(UIOpacity);
        opacityComp.opacity = 255;
        this.node.setScale(1, 1, 1);

        //开启点击监听
        this.node.on(Node.EventType.TOUCH_START, this.onSunClicked, this)

        //开启自动消失计时器
        this.unschedule(this.timeoutDestroy); //以此防重复
        this.scheduleOnce(this.timeoutDestroy, this.lifeTime);
    }
    /**
     * 动作1：从天上下落
     * @param startPos 开始位子
     * @param endPos 结束位置
     */
    public doFallAction(startPos: Vec3, endPos: Vec3) {
        this.node.setPosition(startPos);
        //下落动画
        tween(this.node)
            .to(7, { position: endPos }, { easing: 'sineOut' })//2.5秒落地
            .start();
    }
    /**
    * 动作2：产出（比如向日葵生产），呈抛物线跳出
    */
    public doJumpAction(startPos: Vec3, endPos: Vec3) {
        this.node.setPosition(startPos);
        tween(this.node)
            .to(0.5, { position: endPos }, { easing: 'backOut' })
            .start();

    }

    // 点击事件
    private onSunClicked() {
        if (this.isCollected) return;//防止连续点击
        this.isCollected = true;
        //取消自动消失倒计时
        this.unschedule(this.timeoutDestroy)
        //关闭点击监听
        this.node.off(Node.EventType.TOUCH_START, this.onSunClicked, this)
        //播放飞向UI的动画
        this.flyToUI()
    }
    // 动作3：飞向UI并加分
    private flyToUI() {
        tween(this.node)
            .to(0.5, { position: this.uiTargetPos }, { easing: 'cubicIn' })
            .call(() => {
                //到达后加分
                this.sunManage.addSun(25);
                //回收
                // 清理并回收
                this.cleanup();
                this.sunManage.returnSunToPool(this.node);
            })
            .start();
    }
    // 超时未点击，自动消失
    private timeoutDestroy() {
        if (this.isCollected) return;
        //渐渐消失
        tween(this.getComponent(UIOpacity))
            .to(0.5, { opacity: 0 })
            .call(() => {
                // 清理状态
                this.cleanup();
                this.sunManage.returnSunToPool(this.node);
            })
            .start()
    }
    playSunAnimation() {
        if (this.sunAnimation) {
            // 播放动画
            this.sunAnimation.play();
        }

    }

    public cleanup() {
        // 移除点击监听器
        this.node.off(Node.EventType.TOUCH_START, this.onSunClicked, this);
        // 取消所有定时器
        this.unschedule(this.timeoutDestroy);
        // 重置状态
        this.isCollected = false;
    }
}