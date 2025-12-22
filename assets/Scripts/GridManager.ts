//网格管理器
import { _decorator, Component, instantiate, Node, Prefab, Size, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import { GridCell } from "./GridCell"

//5行9列草坪
@ccclass('GridManager')
export class GridManager extends Component {
    //单例模式
    private static _instance: GridManager = null;
    @property({ type: Prefab, tooltip: "格子预制体" })
    private cellPrefab: Prefab = null
    @property({ type: Node, tooltip: "网格容器节点" })
    private gridContainer: Node = null
    @property({ type: Node, tooltip: "植物容器节点" })
    public plantsContainer: Node = null 
    @property({ type: Size, tooltip: "每个格子的大小" })
    private cellSize: Size = new Size(80, 100)
    @property({ type: Vec3, tooltip: "网格起始位置偏移" })
    private gridOffset: Vec3 = new Vec3(-320, -200, 0)

    // 网格配置
    private readonly ROWS: number = 5 // 5行
    private readonly COLS: number = 9 // 9列
    // 存储所有格子
    private cells: GridCell[][] = []
    // 事件系统
    public static readonly Events = {
        CELL_CLICKED: "cell-clicked",
    }
    public eventTarget: Node = new Node("EventManager")
    public static getInstance(): GridManager {
        return this._instance
    }
    protected onLoad(): void {
        if (GridManager._instance == null) {
            GridManager._instance = this
        } else {
            console.error("GridManager单例模式创建失败")
            this.node.destroy()
            return
        }
    }
    protected start(): void {
        this.initGrid()
    }
    private initGrid(): void {
        if (!this.cellPrefab || !this.gridContainer  || !this.plantsContainer) {
            console.error("GridManager: 缺少 预制体 / 网格容器 / 植物容器")
            return
        }
        for (let row = 0; row < this.ROWS; row++) {
            this.cells[row] = []
            for (let col = 0; col < this.COLS; col++) {
                // 创建格子节点
                const cellNode = instantiate(this.cellPrefab)
                this.gridContainer.addChild(cellNode)
                // 计算格子位置
                const posX = this.gridOffset.x + col * this.cellSize.width
                const posY = this.gridOffset.y + (this.ROWS - 1 - row) * this.cellSize.height
                cellNode.setPosition(posX, posY, 0)
                // 设置格子大小
                const uiTransform = cellNode.getComponent(UITransform)
                if (uiTransform) {
                    uiTransform.setContentSize(this.cellSize)
                }
                // 初始化格子脚本
                const cellScript = cellNode.getComponent(GridCell)
                if (cellScript) {
                    cellScript.init(row, col, this)
                    this.cells[row][col] = cellScript
                }
            }
        }
        console.log(`网格初始化完成: ${this.ROWS}行 x ${this.COLS}列`)
    }
    /**
   * 获取指定位置的格子 ->检擦是否可以种植 -> 种植 -> 移除 -> 通知格子被点击 -> 高亮所有可种植的格子
   */
    public getCell(row: number, col: number): GridCell | null {
        if (row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS) {
            return this.cells[row][col]
        }
        return null
    }
    //检查格子是否可以种植
    public canPlantAt(row: number, col: number): boolean {
        const cell = this.getCell(row, col)
        return cell ? !cell.hasPlant() : false
    }
    //在指定格子种植植物
    public plantAt(row: number, col: number, plantPrefab: Prefab): Node | null {
        const cell = this.getCell(row, col)
        if (cell && !cell.hasPlant()) {
            return cell.plantHere(plantPrefab)
        }
        return null
    }
    //移除指定格子的植物
    public removePlantAt(row: number, col: number): void {
        const cell = this.getCell(row, col)
        if (cell) {
            cell.removePlant()
        }
    }
    //通知格子被点击
    public onCellClicked(row: number, col: number): void {
        this.eventTarget.emit(GridManager.Events.CELL_CLICKED, row, col)
    } 
    //高亮所有可种植的格子
    public highlightAvailableCells(enable: boolean): void {
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        const cell = this.cells[row][col]
        if (cell && !cell.hasPlant()) {
          cell.setHighlight(enable)
        }
      }
    }
    
  }
  //获取植物容器
  public getPlantsContainer(): Node {
        return this.plantsContainer;
    }
}


