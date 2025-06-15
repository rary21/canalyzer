import { render, screen } from '@testing-library/react'
import DBCOverview from '../DBCOverview'
import { DBCDatabase } from '@/types/dbc'

const mockDBCData: DBCDatabase = {
  version: '1.0',
  nodes: [
    { name: 'ECU1', comment: 'Engine Control Unit' },
    { name: 'ECU2' },
    { name: 'Gateway', comment: 'CAN Gateway' }
  ],
  messages: new Map([
    [100, {
      id: 100,
      name: 'EngineData',
      length: 8,
      sendingNode: 'ECU1',
      signals: [
        {
          name: 'EngineSpeed',
          startBit: 0,
          length: 16,
          endianness: 'little' as const,
          signed: false,
          factor: 0.25,
          offset: 0,
          min: 0,
          max: 16383.75,
          unit: 'rpm',
          receivingNodes: ['ECU2']
        },
        {
          name: 'Temperature',
          startBit: 16,
          length: 8,
          endianness: 'little' as const,
          signed: true,
          factor: 1,
          offset: -40,
          min: -40,
          max: 215,
          unit: 'degC',
          receivingNodes: ['Gateway']
        }
      ]
    }],
    [200, {
      id: 200,
      name: 'VehicleSpeed',
      length: 2,
      sendingNode: 'ECU2',
      signals: [
        {
          name: 'Speed',
          startBit: 0,
          length: 16,
          endianness: 'little' as const,
          signed: false,
          factor: 0.01,
          offset: 0,
          min: 0,
          max: 655.35,
          unit: 'km/h',
          receivingNodes: ['ECU1', 'Gateway']
        }
      ]
    }]
  ]),
  baudrate: 500000
}

describe('DBCOverview', () => {
  it('基本情報を正しく表示する', () => {
    render(<DBCOverview data={mockDBCData} />)

    // ラベルの存在確認
    expect(screen.getByText('ノード数')).toBeInTheDocument()
    expect(screen.getByText('メッセージ数')).toBeInTheDocument()
    expect(screen.getByText('シグナル数')).toBeInTheDocument()
    
    // コンポーネントが正常にレンダリングされていることを確認
    expect(screen.getByText('基本情報')).toBeInTheDocument()
  })

  it('DBCファイル詳細を表示する', () => {
    render(<DBCOverview data={mockDBCData} />)

    expect(screen.getByText('1.0')).toBeInTheDocument() // バージョン
    expect(screen.getByText('500,000 bps')).toBeInTheDocument() // ボーレート
  })

  it('メッセージ統計を計算して表示する', () => {
    render(<DBCOverview data={mockDBCData} />)

    expect(screen.getByText('1.5')).toBeInTheDocument() // 平均シグナル数 (3/2 = 1.5)
    // その他の統計項目も表示されることを確認
    expect(screen.getByText('メッセージ統計')).toBeInTheDocument()
  })

  it('ノード概要テーブルを表示する', () => {
    render(<DBCOverview data={mockDBCData} />)

    // ノード名の確認
    expect(screen.getByText('ECU1')).toBeInTheDocument()
    expect(screen.getByText('ECU2')).toBeInTheDocument()
    expect(screen.getByText('Gateway')).toBeInTheDocument()
  })

  it('バージョンが未指定の場合は未指定と表示する', () => {
    const dataWithoutVersion = { ...mockDBCData, version: '' }
    render(<DBCOverview data={dataWithoutVersion} />)

    expect(screen.getByText('未指定')).toBeInTheDocument()
  })

  it('ボーレートが未指定の場合は表示しない', () => {
    const dataWithoutBaudrate = { ...mockDBCData }
    delete dataWithoutBaudrate.baudrate
    render(<DBCOverview data={dataWithoutBaudrate} />)

    expect(screen.queryByText('ボーレート')).not.toBeInTheDocument()
  })

  it('ノードが0件の場合はノード概要を表示しない', () => {
    const dataWithoutNodes = { ...mockDBCData, nodes: [] }
    render(<DBCOverview data={dataWithoutNodes} />)

    expect(screen.queryByText('ノード概要')).not.toBeInTheDocument()
  })
})