import { _decorator, CCInteger, Component, Node, Sprite } from 'cc';
import { SunManager } from './SunManager';
import { PlantManager } from './PlantManager';
const { ccclass, property } = _decorator;

@ccclass('Card')
export class Card extends Component {
    //--绑定节点--
    @property({ type: Node, tooltip: '亮色底图' })
    cardLight: Node = null;
    @property({ type: Node, tooltip: '暗色底图' })
    cardGray: Node = null;
    @property({ type: Sprite, tooltip: '冷却遮罩' })
    cardMask: Sprite = null;

    //--属性配置--
    @property({ type: CCInteger, tooltip: '植物ID' })
    plantID: number = 0;
    @property({ type: CCInteger, tooltip: '需要多少阳光' })
    price: number = 100;
    @property({ type: CCInteger, tooltip: '冷却时间' })
    cdTime: number = 5;

    //--内部状态--
    private currentCD: number = 0;//当前剩余冷却时间
    private isReady: boolean = false;//是否可种植

    onLoad() {
        //初始状态，初始冷却时间
        this.currentCD = this.cdTime;
        //绑定点击事件
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this)
    }
    update(deltaTime: number) {
        //处理冷却
        if (this.currentCD > 0) {
            this.currentCD -= deltaTime;
            if (this.currentCD <= 0) this.currentCD = 0;
            this.cardMask.fillRange = -(this.currentCD / this.cdTime);
            this.cardMask.node.active = true;
        } else {
            this.cardMask.node.active = false;
        }
        //从SunManager中获取当前阳光数量
        let currentTotalSun = SunManager.get_instance().SunPoint;

        //调用切换图片的方法
        this.checkState(currentTotalSun);
    }
    checkState(currentTotalSun: number) {
        if (currentTotalSun >= this.price) {
            this.cardLight.active = true;
            this.cardGray.active = false;
            this.isReady = (this.currentCD <= 0)
        } else {
            this.cardLight.active = false;
            this.cardGray.active = true;
            this.isReady = false;
        }
    }

    onClick() {
    const sunManager = SunManager.get_instance()
    const plantManager = PlantManager.getInstance()

    if (!this.isReady) {
      if (this.currentCD > 0) {
        console.log("冷却中暂时不可种植")
        return
      } else {
        console.log("阳光不足")
        return
      }
    }

    // 消费阳光
    if (sunManager.spendSun(this.price)) {
      console.log("已选择植物，请点击网格种植")

      // 开始冷却
      this.startCooldown()

      // 通知PlantManager开始选择种植位置
      if (plantManager) {
        plantManager.startPlanting(this.plantID)
      }
    }
  }    // 外部调用：当植物种下去后，重新开始冷却
    public startCooldown() {
        this.currentCD = this.cdTime;
    }
}


