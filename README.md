# CNB 鍥惧簥 Pro

涓€涓畝娲併€佸畨鍏ㄧ殑杞婚噺绾у浘搴婂簲鐢紝鏀寔瀵嗙爜楠岃瘉銆佹嫋鎷戒笂浼犮€佺浉鍐岀鐞嗗拰鍥剧墖棰勮锛岃繍琛屽湪鑵捐浜?EdgeOne Pages 涓婏紝鏂囦欢瀛樺偍鍦?CNB(cnb.cool)瀵硅薄瀛樺偍涓€?
## 鍔熻兘鐗规€?
- 馃攼 瀵嗙爜楠岃瘉 - 瀹夊叏璁块棶鎺у埗
- 馃摛 鎷栨嫿涓婁紶 - 鏀寔鎷栨嫿鎴栫偣鍑讳笂浼狅紝鏀寔澶氭枃浠朵笌涓婁紶杩涘害
- 馃柤锔?鐩稿唽绠＄悊 - 鍥剧墖/瑙嗛缃戞牸灞曠ず锛屾寜鏃堕棿鍊掑簭锛屾敮鎸佹悳绱?- 馃攳 鍥剧墖棰勮 - 鍏ㄥ睆棰勮锛屾敮鎸侀敭鐩樺鑸紙鈫?/ 鈫?/ Esc锛?- 馃搵 閾炬帴澶嶅埗 - 涓€閿鍒剁洿閾?/ Markdown / HTML 寮曠敤
- 馃棏锔?鍥剧墖绠＄悊 - 鏀寔鍒犻櫎鏂囦欢
- 馃寵 涓婚鍒囨崲 - 鏀寔鏄庢殫涓婚

## 鎶€鏈爤

- **鍓嶇**: Vue 3 + TypeScript + Vite + TailwindCSS + Pinia
- **鍚庣**: Edge Functions锛堣吘璁簯 EdgeOne Pages锛?- **瀛樺偍**: CNB / cnb.cool 瀵硅薄瀛樺偍锛堟案涔呯洿閾撅紝鍥剧墖涓庤棰戝垎绂诲瓨鍌級

## API 鏂囨。

鎵€鏈夋帴鍙ｈ繑鍥炵粺涓€ JSON 缁撴瀯锛歚{ "code": 0, "msg": "ok", "data": ... }`锛宍code` 涓?`0` 琛ㄧず鎴愬姛銆?
### 1. 楠岃瘉瀵嗙爜

```
POST /api/auth/verify
Content-Type: application/json

{
  "password": "浣犵殑瀵嗙爜"
}
```

- 鎴愬姛锛歚{ "code": 0, "msg": "ok", "data": { "success": true } }`
- 瀵嗙爜閿欒锛歚401` `{ "code": 401, "msg": "wrong password" }`
- 鏈嶅姟鍣ㄦ湭閰嶇疆瀵嗙爜锛歚{ "code": 400, "msg": "server password not configured" }`

### 2. 鑾峰彇涓婁紶绛惧悕

鍓嶇涓婁紶鍓嶅厛璋冪敤锛岃幏鍙栧璞″瓨鍌ㄧ殑涓婁紶鍦板潃锛坄upload_url`锛変笌宸茬粡闅忔満閲嶅懡鍚嶇殑鏂囦欢鍚嶏紙`safeFileName`锛夈€傚浘鐗囥€佽棰戯紙mp4/mov/mkv/webm/m4v/3gp锛変細鑷姩鍒嗘祦鍒颁笉鍚岀殑瀛樺偍妗躲€?
```
GET /api/upload/sign?name=example.png&size=10240
```

- 缂哄皯鍙傛暟锛歚{ "code": 400, "msg": "missing name or size param" }`
- 鎴愬姛锛歚{ "code": 0, "data": { "upload_url": "...", "assets": {...}, "safeFileName": "..." } }`

### 3. 涓婁紶鏂囦欢锛圥UT 鍒板璞″瓨鍌級

鑾峰彇绛惧悕鍚庯紝灏嗘枃浠朵簩杩涘埗浣滀负璇锋眰浣撲紶鍏?`upload_url`銆?
```
POST /api/upload/put?upload_url=<sign杩斿洖鐨剈pload_url>
Content-Type: application/octet-stream

<鏂囦欢浜岃繘鍒?
```

- 鎴愬姛锛歚{ "code": 0, "msg": "ok" }`
- 缂哄皯鍙傛暟锛歚{ "code": 400, "msg": "missing upload_url param" }`
- 瀵硅薄瀛樺偍涓婁紶澶辫触锛氳繑鍥?`502`锛岄敊璇俊鎭湪 `data.message` 涓?
### 4. 鑾峰彇鏂囦欢鍒楄〃

```
GET /api/files
```

- 鎴愬姛锛歚{ "code": 0, "data": [ { "id": "...", "key": "...", "url": "/img-api/...", "name": "x.png", "size": 123, "type": "image/png", "createdAt": "..." } ] }`锛堟寜鍒涘缓鏃堕棿鍊掑簭锛?
### 5. 鍒犻櫎鏂囦欢

```
DELETE /api/file?path=<鏂囦欢鐨?key锛堝惈 /-/imgs/ 鎴?/-/files/锛?
```

- 鎴愬姛锛歚{ "code": 0, "msg": "ok" }`
- 缂哄皯鍙傛暟锛歚{ "code": 400, "msg": "missing path param" }`
- 璺緞鏃犳晥锛歚{ "code": 400, "msg": "invalid path" }`

### 6. 璁块棶鍥剧墖 / 瑙嗛鐩撮摼

```
GET /img-api/<mediaPath>
```

`mediaPath` 鏄枃浠跺湪瀛樺偍涓殑璺緞锛堝垪琛ㄦ帴鍙?`url` 瀛楁鐨?`\"/img-api/\"` 涔嬪悗閮ㄥ垎锛夛紝鏀寔 CDN 鍔犻€熴€?
## 蹇€熷紑濮?
### 鐜瑕佹眰

- Node.js >= 20.0.0
- pnpm >= 10.0.0

### 瀹夎

```bash
pnpm install
```

### 寮€鍙?
```bash
pnpm dev
```

### 鏋勫缓

```bash
pnpm build
```

## 鐜鍙橀噺锛圗dge Functions 缁戝畾锛?
鍦?EdgeOne Pages 鐜涓厤缃互涓嬪彉閲忥細

| 鍙橀噺 | 璇存槑 |
|------|------|
| `UPLOAD_PASSWORD` | 涓婁紶璁块棶瀵嗙爜锛坄/api/auth/verify` 鏍￠獙锛?|
| `SLUG_IMG` | cnb.cool 瀛樺偍搴撹矾寰勶紝榛樿 `wujinpai/cnbimg` |
| `TOKEN_IMG` | cnb.cool 璁块棶浠ょ墝锛堣/鍐欏瓨鍌級 |

## 閮ㄧ讲

閮ㄧ讲鍒拌吘璁簯 EdgeOne Pages锛圙it 闆嗘垚锛屾帹 main 鑷姩鏋勫缓閮ㄧ讲锛夛細

1. `dist/` 鈫?Pages 闈欐€佺珯鐐癸紙瑙?`edgeone.json` 鐨?`outputDirectory`锛?2. `edge-functions/**` 鈫?Edge Functions锛堣嚜鍔ㄩ儴缃插埌瀵瑰簲璺敱锛?3. 閰嶇疆涓婅堪鐜鍙橀噺鍚庡嵆鍙娇鐢?
## 璁稿彲璇?
MIT