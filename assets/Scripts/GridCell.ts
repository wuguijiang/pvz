// assets/Scripts/GridCell.ts单个网格格子
import { _decorator, Component, Node, Sprite, Color, type Prefab, instantiate, UITransform, Vec3 } from "cc"
import type { GridManager } from "./GridManager"
const { ccclass, property } = _decorator

@ccclass("GridCell")
export class GridCell extends Component {
    @property({ type: Sprite, tooltip: "格子背景Sprite" })
    private bgSprite: Sprite = null
    // 格子坐标
    private row = 0
    private col = 0

    // 引用管理器
    private gridManager: GridManager = null
    // 当前格子上的植物
    private currentPlant: Node = null
    // 颜色配置
    private readonly normalColor: Color = new Color(255, 255, 255, 0) // 完全透明
    private readonly highlightColor: Color = new Color(100, 255, 100, 150) // 半透明绿色
    private readonly occupiedColor: Color = new Color(255, 255, 255, 0) // 透明

    //初始化格子
    public init(row: number, col: number, manager: GridManager): void {
        this.row = row
        this.col = col
        this.gridManager = manager
        if (!this.bgSprite) {
            this.bgSprite = this.getComponent(Sprite)
        }
        if (this.bgSprite) {
            this.bgSprite.color = this.normalColor
        }
        // 绑定点击事件
        this.node.on(Node.EventType.TOUCH_END, this.onCellClick, this)
    }
    //格子点击事件
 private onCellClick(): void {
     console.log(`格子被点击: 行${this.row}, 列${this.col}`)
      if (this.gridManager) {
      this.gridManager.onCellClicked(this.row, this.col)
    }
 }
 //设置高亮状态
 public setHighlight(enable: boolean): void {
    if (!this.bgSprite) return
     if (enable && !this.hasPlant()) {
      this.bgSprite.color = this.highlightColor
    } else {
      this.bgSprite.color = this.normalColor
    }
 }
//  检查是否有植物
public hasPlant(): boolean {
    return this.currentPlant != null
  }

//   在此格子种植植物
 public plantHere(plantPrefab: Prefab): Node | null {
    if (this.hasPlant()) {
      console.warn(`格子[${this.row},${this.col}]已经有植物了`)
      return null
    }
    // 实例化植物
    this.currentPlant = instantiate(plantPrefab)
    //获取植物的父容器
     const plantsContainer = this.gridManager.getPlantsContainer()
     if (!plantsContainer) {
            console.error("无法获取植物容器，请检查GridManager设置")
            return null
        }
     plantsContainer.addChild(this.currentPlant)
     const cellWorldPos = this.node.getComponent(UITransform).convertToWorldSpaceAR(new Vec3(0, 0, 0))
     const plantLocalPos = plantsContainer.getComponent(UITransform).convertToNodeSpaceAR(cellWorldPos)
      this.currentPlant.setPosition(plantLocalPos)
    
     // 更新格子状态
    if (this.bgSprite) {
      this.bgSprite.color = this.occupiedColor
    }
    console.log(`植物已种植在格子[${this.row},${this.col}]`)
    return this.currentPlant
 }
 //移除植物
 public removePlant(): void {
    if (this.currentPlant) {
      this.currentPlant.destroy()
      this.currentPlant = null

      // 恢复格子状态
      if (this.bgSprite) {
        this.bgSprite.color = this.normalColor
      }
    }
  }
  //获取格子坐标
  public getRow(): number {
    return this.row
  }

  public getCol(): number {
    return this.col
  }

  protected onDestroy(): void {
    this.node.off(Node.EventType.TOUCH_END, this.onCellClick, this)
  }
}
