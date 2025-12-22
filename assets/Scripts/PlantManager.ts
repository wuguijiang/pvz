// assets/Scripts/PlantManager.ts 植物种植管理器
import { _decorator, Component, Node, Prefab } from 'cc';
import { GridManager } from "./GridManager"

const { ccclass, property } = _decorator;

@ccclass('PlantManager')
export class PlantManager extends Component {
    private static _instance: PlantManager = null
    @property({ type: Prefab, tooltip: "向日葵预制体" })
    private sunflowerPrefab: Prefab = null
    @property({ type: Prefab, tooltip: "豌豆射手预制体（未来添加）" })
    private peashooterPrefab: Prefab = null

    // 当前选中的植物类型
    private selectedPlantID = -1
    private selectedPlantPrefab: Prefab = null


    // 是否处于选择种植位置的状态
    private isSelectingPosition = false

    public static getInstance(): PlantManager {
        return this._instance
    }

    protected onLoad(): void {
        if (PlantManager._instance == null) {
            PlantManager._instance = this
        } else {
            console.error("PlantManager单例模式创建失败")
            this.node.destroy()
            return
        }
    }
    protected start(): void {
        // 监听网格格子点击事件
        const gridManager = GridManager.getInstance()
        if (gridManager) {
            gridManager.eventTarget.on(GridManager.Events.CELL_CLICKED, this.onGridCellClicked, this)
        }
    }
    /**
    * 开始选择种植位置（由Card调用）
    */
    public startPlanting(plantID: number): void {
        this.selectedPlantID = plantID
        this.selectedPlantPrefab = this.getPlantPrefab(plantID)
        if (!this.selectedPlantPrefab) {
            console.error(`找不到植物ID=${plantID}的预制体`)
            return
        }
        this.isSelectingPosition = true
        // 高亮所有可种植的格子
        const gridManager = GridManager.getInstance()
        if (gridManager) {
            gridManager.highlightAvailableCells(true)
        }
        console.log(`开始选择种植位置，植物ID: ${plantID}`)
    }
    /**
  * 取消种植
  */
    public cancelPlanting(): void {
        this.isSelectingPosition = false
        this.selectedPlantID = -1
        this.selectedPlantPrefab = null

        // 取消高亮
        const gridManager = GridManager.getInstance()
        if (gridManager) {
            gridManager.highlightAvailableCells(false)
        }

        console.log("取消种植")
    }
    //   根据植物ID获取对应的预制体
    private getPlantPrefab(plantID: number): Prefab | null {
        switch (plantID) {
            case 0: // 向日葵
                return this.sunflowerPrefab
            case 1: // 豌豆射手（未来添加）
                return this.peashooterPrefab
            default:
                return null
        }
    }
    /**
   * 格子被点击时的处理
   */
    private onGridCellClicked(row: number, col: number): void {
        if (!this.isSelectingPosition) {
            return
        }
        const gridManager = GridManager.getInstance()
        if (!gridManager) return
        // 检查该格子是否可以种植
        if (gridManager.canPlantAt(row, col)) {
            // 种植植物
            const plantNode = gridManager.plantAt(row, col, this.selectedPlantPrefab)

            if (plantNode) {
                console.log(`植物已种植在[${row}, ${col}]`)

                // 种植成功，结束选择状态
                this.cancelPlanting()
            }
            else {
                console.log(`格子[${row}, ${col}]已被占用或不可用`)
            }
        }
    }
    /**
   * 检查是否正在选择种植位置
   */
    public isSelecting(): boolean {
        return this.isSelectingPosition
    }
    protected onDestroy(): void {
        const gridManager = GridManager.getInstance()
        if (gridManager) {
            gridManager.eventTarget.off(GridManager.Events.CELL_CLICKED, this.onGridCellClicked, this)
        }
    }

}


