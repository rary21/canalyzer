# DBCファイル形式の仕様

## 概要

DBC (Database CAN) ファイルは、CAN (Controller Area Network) ネットワークの通信データを記述するためのテキストベースのフォーマットです。Vector社によって定義され、自動車業界で広く使用されています。

## 基本構造

DBCファイルは以下の要素で構成されます：

### 1. バージョン情報

```
VERSION ""
```

### 2. 新規シンボル定義 (NS\_)

```
NS_ :
  NS_DESC_
  CM_
  BA_DEF_
  BA_
  VAL_
  ...
```

### 3. ビット速度 (BS\_)

```
BS_: <baudrate>
```

### 4. ノード定義 (BU\_)

```
BU_ <Node1> <Node2> ... <NodeN>
```

例：`BU_ ECU1 ECU2 Gateway`

### 5. メッセージ定義 (BO\_)

```
BO_ <CAN-ID> <MessageName>: <MessageSize> <SendingNode>
```

- CAN-ID: 10進数または16進数のメッセージID
- MessageName: メッセージ名
- MessageSize: バイト単位のメッセージサイズ（0-8）
- SendingNode: 送信ノード名

例：`BO_ 100 EngineData: 8 ECU1`

### 6. シグナル定義 (SG\_)

```
SG_ <SignalName> : <StartBit>|<Length>@<Endianness><Signed> (<Factor>,<Offset>) [<Min>|<Max>] "<Unit>" <ReceivingNodes>
```

- SignalName: シグナル名
- StartBit: 開始ビット位置
- Length: ビット長
- Endianness: バイトオーダー（0=モトローラ/ビッグエンディアン、1=インテル/リトルエンディアン）
- Signed: 符号（+=符号なし、-=符号付き）
- Factor: スケールファクター
- Offset: オフセット値
- Min/Max: 最小値/最大値
- Unit: 単位
- ReceivingNodes: 受信ノード（カンマ区切り）

例：`SG_ EngineSpeed : 0|16@1+ (0.25,0) [0|16383.75] "rpm" Gateway,Display`

### 7. 値の説明 (VAL\_)

```
VAL_ <CAN-ID> <SignalName> <Value> "<Description>" ;
```

例：`VAL_ 100 GearPosition 0 "Park" 1 "Reverse" 2 "Neutral" 3 "Drive" ;`

### 8. コメント (CM\_)

```
CM_ <Object> <Comment>;
```

- Object: BU* "NodeName"、BO* CAN-ID、SG\_ CAN-ID SignalName など

例：`CM_ BO_ 100 "Engine control unit main data";`

## パース時の注意点

1. **エンコーディング**: 通常はASCIIまたはUTF-8
2. **行末**: WindowsスタイルのCRLFまたはUnixスタイルのLF
3. **空白**: タブとスペースは区別されない
4. **コメント**: C++スタイルの`//`コメントが使用可能
5. **大文字小文字**: キーワードは大文字小文字を区別する

## 実装方針

1. **段階的パース**:

   - 第1段階: メッセージとシグナルの基本情報のみ
   - 第2段階: 値の説明、コメントなどの付加情報
   - 第3段階: 属性定義などの高度な機能

2. **エラーハンドリング**:

   - 不正な形式の行はスキップし、警告を出力
   - 必須要素（メッセージ、シグナル）のみ確実にパース

3. **データ構造**:
   - メッセージIDをキーとしたマップ構造
   - シグナルは各メッセージ内の配列として保持
