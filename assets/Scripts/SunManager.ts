//阳光管理系统
import { _decorator, Component, Node, Label, NodePool, Prefab, Color, Vec3, instantiate, view, v3, UITransform } from 'cc';
import { Sun } from './Sun';
const { ccclass, property } = _decorator;

@ccclass('SunManager')
export class SunManager extends Component {

    //定义一个名为 SunManager 的脚本组件
    //静态变量，保持唯一的实例，实现单列模式
    private static _instance: SunManager = null;

    @property(Number)
    private sunPoint: number = 50; //当前的阳光数（开局50阳光）
    @property(Label)
    private sunLabel: Label = null;//阳光显示
    private originalColor: Color = Color.BLACK;// 原始颜色存储
    //关于生成阳光的参数
    @property(Prefab)
    private sunPrefab: Prefab = null;
    @property(Node)
    private sunIconNode: Node = null; // 拖入UI左上角的阳光图标节点（作为飞行目标）
    @property(Node)
    private gameLayer: Node = null; // 阳光生成的父节点（通常是Canvas或者专门的ItemLayer）
    private sunPool: NodePool = new NodePool(); // 创建一个对象池
    private skyDropInterval: number = 10;// 10秒掉一次
    private skyDropTimer: number = 0;
    public static get_instance(): SunManager {
        return this._instance|| null;;
    }

    //公共静态方法，获取全局唯一的SunManager实例
    public get SunPoint(): number {
        return this.sunPoint;
    }

    //设置阳光值的方法
    public set SunPoint(value: number) {
        this.sunPoint = value;
        this.updateSunDisplay();
    }
    //更新阳光值显示
    public updateSunDisplay(): void {
        if (this.sunLabel) {
            this.sunLabel.string = this.sunPoint.toString();
        }
    }
    //增加阳光和消耗阳光
    public addSun(amount: number): void {
        this.sunPoint += amount;
        this.updateSunDisplay();
    }
    public spendSun(amount: number): boolean {
        if (this.sunPoint >= amount) {
            this.sunPoint -= amount;
            this.updateSunDisplay();
            console.log("消耗阳光成功")
            return true;
        } else {
            this.showInsufficientSunWarning();
            console.error("阳光不足")
            return false;
        }

    }

    //获取当前阳光值的只读属性
    protected onLoad(): void {
        if (SunManager._instance == null) {
            SunManager._instance = this;
        } else {
            console.error("SunManager单例模式创建失败");
            this.node.destroy();
            return
        }
    }
    protected start(): void {
        this.updateSunDisplay();
        // 开始计时掉落阳光 (每10秒一次)
        this.schedule(this.spawnSunFromSky, this.skyDropInterval);
        //  this.scheduleOnce(this.spawnSunFromSky, 3)
    }
    // 显示阳光不足警告
    public showInsufficientSunWarning(): void {
        if (this.sunLabel) {
            // 存储原始颜色
            this.originalColor = this.sunLabel.color.clone();

            // 设置为红色
            this.sunLabel.color = Color.RED;
            // 1秒后恢复原色
            this.scheduleOnce(() => {
                if (this.sunLabel && this.isValid) {
                    this.sunLabel.color = this.originalColor;
                }
            }, 0.1);

        }
    }
    // --- 核心逻辑：生成阳光 ---
    //从对象池获取或实例化阳光
    private getSunNode(): Node {
        let sunNode: Node = null;
        if (this.sunPool.size() > 0) {
            sunNode = this.sunPool.get();
        } else {
            sunNode = instantiate(this.sunPrefab);
        } return sunNode;

    }
    // 回收阳光到对象池 (由Sun脚本调用)
    public returnSunToPool(sunNode: Node) {
        this.sunPool.put(sunNode);
    }

    /**
    * 场景一：天空掉落阳光
    */
    public spawnSunFromSky() {
        //判断有没有父节点和预制体，并创建一个阳光节点，放在父节点下面
        if (!this.gameLayer || !this.sunPrefab) return;
        let sunNode = this.getSunNode();
        this.gameLayer.addChild(sunNode);
        console.log("天空掉落阳光")
        // 设置阳光节点的位置 先获取屏幕可视范围宽度
        let visibleSize = view.getVisibleSize();
        let sceneWidth = visibleSize.width;
        let sceneHeight = visibleSize.height;
        //随机x坐标（屏幕的10%---90%） 
        let randomX = (Math.random() - 0.5) * (sceneWidth * 0.7);
        // 2. 起始Y坐标 (屏幕顶端上面一点)
        let startY = sceneHeight / 2 + 100
        // 3. 随机落点Y坐标 (屏幕下半部分)
        let endY = (Math.random() * (sceneHeight * 0.4)) - (sceneHeight / 2 - 100);
        console.log(randomX)
        console.log(startY)
        console.log(endY)
        // 获取UI图标在 gameLayer 坐标系下的位置 (用于告诉阳光飞去哪)
        let targetPos = this.getIconPositionInGameLayer();
        //初始阳光脚本
        let sunScript = sunNode.getComponent(Sun);
        if (sunScript) {
            sunScript.init(this, targetPos);
            sunScript.doFallAction(v3(randomX, startY, 0), v3(randomX, endY, 0));
        }
    }
    /**
     * 场景二：向日葵生产阳光 (供外部调用)
     * @param producerPos 向日葵的世界坐标
     */
    public spawnSunAt(producerPos: Vec3) {
        let sunNode = this.getSunNode();
        this.gameLayer.addChild(sunNode);
        console.log("向日葵生成阳光")

        // 将向日葵的世界坐标转换为 gameLayer 的局部坐标
        let startPos = this.gameLayer.getComponent(UITransform).convertToNodeSpaceAR(producerPos);
        sunNode.setPosition(startPos);
        // 落点在附近随机位置
        let endPos = v3(startPos.x + (Math.random() * 50 - 25), startPos.y - 30, 0);
        console.log(startPos)
        let targetPos = this.getIconPositionInGameLayer();

        let sunScript = sunNode.getComponent(Sun);
        if (sunScript) {
            sunScript.init(this, targetPos);
            sunScript.doJumpAction(startPos, endPos);
        }
    }

    // 辅助：获取UI图标相对于GameLayer的坐标
    private getIconPositionInGameLayer(): Vec3 {
        if (!this.sunIconNode) return v3(0, 0, 0);
        // 获取UI图标的世界坐标
        let worldPos = this.sunIconNode.getComponent(UITransform).convertToWorldSpaceAR(v3(0, 0, 0));
           // 转换为GameLayer下的局部坐标
        return this.gameLayer.getComponent(UITransform).convertToNodeSpaceAR(worldPos);

    }
}



