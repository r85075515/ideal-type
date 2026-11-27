# **GEMINI 理想型紅隊診斷與轉化優化報告（ideal-type.plaigroundlab.com）**

* **診斷對象**：ideal-type.plaigroundlab.com（AI 寵物聖誕卡客製包）  
* **診斷日期**：2026-11-27（距離 2026-12-05 存續重判尚餘 8 天）  
* **現況基準**：販售頁已上線、Stripe 已可收款（單張 US\$9.99／三張 US\$19.99），目前實際付款 \$0；交付流程正由人工過渡至 R2 簽名限時下載自動交付；網站支援繁體中文＋英文雙語。  
* **紅隊守則（誠實邊界）**：所有改寫文案與交付模板均嚴格排除「即時生成／秒出圖」、「保證 100% 相似度／絕對還原」、「實體印刷寄送」等無法兌現或誇大之承諾。

# **一、10 種冷流量訪客旅程模擬表（Landing → Quiz → 結果頁 → 付款頁）**

| 編號與訪客類型 | 裝置／流量來源 | Landing Page 反應與獨白 | Quiz 測驗反應與獨白 | 結果頁反應與獨白 | 付款頁反應與獨白 | 最終結果／主要流失點 |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **\#01 價格敏感精算型** | iPhone Safari／IG Reels 廣告 | 「先看看這到底多少錢…首頁沒寫價格，也沒有免費試做，直接叫我開始測驗？先點點看好了。」 | 「題目跟我想的不太一樣，有點長，如果等一下要收費我可能就關掉了。」 | 「果然！結果頁什麼成品預覽都沒看到，就要我付 US\$9.99 買一張圖片？ChatGPT Plus 一個月也才 20 鎂，這張圖憑什麼賣 300 多台幣？」 | （未進入或僅瞄一眼總金額後跳出） | **流失於【結果頁 → 付款頁】**（缺乏與價格匹配的差異化價值證明） |
| **\#02 深夜衝動毛孩奴型** | Android Chrome／TikTok 短影音 | 「天啊狗勾聖誕卡好可愛！點進去看看！」 | 「選風格滿好玩的，像在做心理測驗，邊滑邊選很快。」 | 「喔喔結果出爐了！好想馬上看到我家柴犬穿聖誕毛衣的樣子！按購買！」 | 「咦，要填信用卡號，還要上傳照片？我現在躺床上沒好照片，而且這付款後是馬上拿到嗎？沒寫清楚…算了明天再說。」 | **流失於【付款頁】**（睡前無照片＋交付時間與流程不明導致冷卻） |
| **\#03 懷疑 AI 品質與翻車恐懼型** | Desktop Chrome／Reddit 寵物版討論串 | 「又是 AI 生成？該不會把我家黑貓畫成一團黑炭或長出六隻腳吧？首頁範例看起來還行，但不確定是不是挑出來的。」 | 「選項只有文字風格，沒有讓我描述我家貓的特殊花紋，這樣 AI 真的懂嗎？」 | 「叫我直接付 US\$19.99 買三張，萬一生成出來完全不像我家貓，能重做或退款嗎？完全沒寫保障機制。」 | （未進入） | **流失於【結果頁】**（AI 翻車風險未拆解、無修改／品質預期說明） |
| **\#04 趕聖誕送禮／印賀卡急件型** | Desktop Safari／Google 搜尋「custom pet christmas card」 | 「聖誕節快到了，我要做卡片寄給親友。這是電子檔還是會寄實體卡片來？首頁沒講清楚。」 | 「我只想趕快挑好版型下單，這些性格測驗題目有點拖時間。」 | 「原來是數位圖檔，那解析度夠拿去印 5x7 實體卡嗎？付款後多久拿得到？如果趕不上送印怎麼辦？」 | 「Stripe 頁面沒有顯示預計交付時間，我不敢賭，去找 Etsy 現成模板好了。」 | **流失於【結果頁 → 付款頁】**（檔案規格、印刷適用性與交付時效資訊缺失） |
| **\#05 多寵家庭／選擇障礙型** | iPad Safari／Facebook 寵物社團分享 | 「我家有兩隻狗一隻貓，這個可以一起畫在一張嗎？首頁好像都是單隻？」 | 「測驗只能選單一性格方向，沒有『多隻寵物合體』的選項。」 | 「單張 US\$9.99、三張 US\$19.99，是指三隻各一張，還是一張裡面三隻？我如果買三張組，可以分別給不同寵物嗎？」 | （因規格疑問未獲解答而跳出） | **流失於【結果頁】**（三張 US\$19.99 方案內容定義模糊） |
| **\#06 隱私與照片授權顧慮型** | Desktop Firefox／Threads 轉貼 | 「要上傳我家毛孩照片給 AI 網站？這些照片會不會被拿去訓練模型或公開當廣告？」 | 「先看看它問什麼，還好測驗本身不用先傳照片。」 | 「要買的時候才發現沒有看到隱私聲明或照片刪除政策，連聯絡信箱／工作室背景都看不太出來是誰做的。」 | （對不知名網站刷卡有戒心，放棄） | **流失於【結果頁 → 付款頁】**（品牌信任感與隱私處理說明不足） |
| **\#07 跨國送禮／英文介面依賴型** | iPhone Chrome／X (Twitter) 推文 | 「（切換英文版）概念滿有趣的，但有些翻譯語氣有點生硬，不太確定這是不是正經在營運的服務。」 | 「測驗選項的英文有點抽象，不確定選這個會影響最後卡片的什麼元素。」 | 「US\$9.99 對美國市場不算貴，但結果頁的英文 CTA 沒有說清楚『付完錢接下來會發生什麼事』。」 | 「跳轉到 Stripe 後看到幣別與收款方名稱，沒看到訂單確認與交付方式說明，猶豫一下就關掉了。」 | **流失於【付款頁】**（英文語氣在地化不足＋付後流程透明度不夠） |
| **\#08 只看免費試玩／白嫖測驗型** | Android IG In-App Browser／IG 限動連結 | 「測測看你家毛孩的聖誕理想型？免費測驗好玩耶，點進去！」 | 「題目滿好玩的，快速按完看結果！」 | 「蛤？測完不能免費生成一張預覽圖嗎？還要付 US\$9.99 才能拿圖？我只是想玩免費測驗而已耶，掰掰。」 | （未進入） | **流失於【結果頁】**（受眾預期錯置：誤以為是免費娛樂測驗） |
| **\#09 設計審美潔癖／質感要求型** | MacBook Chrome／Pinterest 搜尋 | 「我很怕那種很廉價的 AI 塑膠感圖片。這裡有真實成品範例可以看嗎？字體排版跟卡片邊框設計感如何？」 | 「測驗題目沒有針對美術風格（油畫、水彩、復古版畫）給出清楚視覺範例，我怎麼知道自己選對？」 | 「沒有高畫質成品細節圖可以放大檢視，直接推 US\$19.99 三張包，質感風險太高。」 | （未進入） | **流失於【Landing / Quiz → 結果頁】**（缺乏視覺風格對照範例與成品質感證明） |
| **\#10 長輩或非科技熟手代購型** | Android LINE In-App Browser／親友群組轉傳 | 「女兒傳來這個說好可愛，點進來看看…字有點小，英文跟中文混在一起不太確定怎麼買。」 | 「這個測驗是一定要做完才能買嗎？我只想直接傳狗狗照片請他幫我做一張聖誕卡。」 | 「終於按完了，結果出現兩個價格 US\$9.99 跟 US\$19.99，美金是多少台幣啊？在 LINE 裡面按付款會不會卡住？」 | 「LINE 內建瀏覽器跳轉 Stripe 刷卡要輸入驗證碼，跳出去看簡訊回來頁面不見了。」 | **流失於【付款頁】**（In-App Browser 跳轉摩擦＋幣別換算門檻） |

# **二、流失率最高的前 3 個環節排行與止血診斷**

1. **第 1 名：結果頁 → 付款頁（Value-to-Price Gap 與交付黑箱）** — 佔模擬流失 50%（5/10 人直接死在此關：\#01, \#03, \#05, \#06, \#08，另有 \#04 跨此關與付款頁）  
   * **核心病灶**：測驗結束後，訪客未獲得足夠的「視覺預期」與「交易安全感」，卻立刻面對 US\$9.99 / US\$19.99 的付費牆。五大阻力齊發：(1) 不知道成品長怎樣、翻車怎麼辦；(2) 不知道付款後何時拿到、怎麼拿到（電子檔 vs 實體卡）；(3) 三張 US\$19.99 的使用規則不清（可否給不同寵物／不同風格）；(4) 隱私與照片處理未交代；(5) 誤以為有免費生成圖的白嫖客在這裡集中勸退（雖然這是正常過濾，但應該在 Landing 就過濾掉，不要浪費漏斗後面）。  
2. **第 2 名：付款頁（Checkout 最後一哩路摩擦與冷卻）** — 佔模擬流失 30%（3/10 人死在此關：\#02, \#07, \#10，加上 \#04）  
   * **核心病灶**：好不容易按下購買，卻在臨門一腳因「資訊斷層」冷卻：(1) 手機躺在床上沒有現成寵物照片，誤以為「結帳當下就必須列車上傳」；(2) Stripe 結帳頁前後缺乏「付款後流程時間軸」與「數位高畫質電子檔規格說明」；(3) 繁中訪客對 US\$ 美元計價缺乏直覺換算參考；(4) LINE / IG 內建瀏覽器跳轉問題。  
3. **第 3 名：Landing Page ＋ Quiz 前段（期望值錯置與風格盲選）** — 佔模擬流失 20%（直接影響 \#04, \#09，並連帶埋下 \#01, \#08 的失敗伏筆）  
   * **核心病灶**：(1) 首屏沒有在一開始就明講「這是一項付費客製數位聖誕卡服務（US\$9.99 起）」，導致吸引大量只想免費玩 AI 的流量進 Quiz，拉低整體轉化分母；(2) Quiz 題目偏像「抽象心理測驗」，訪客感覺不到自己的選項如何真正決定成品的「畫風、場景、節慶氛圍」，導致測完不覺得這個結果非買不可。

# **三、高流失環節文案重寫全文（繁中主版＋英文版）**

## **3.1 Landing Page 標題與副標（過濾白嫖流量、定錨數位客製價值）**

### **【繁中主版】**

* **主標題（Headline）**：  
  為你家毛孩訂製一張，今年最值得寄出的聖誕數位賀卡  
* **副標題（Subheadline）**：  
  花 45 秒完成 5 個風格選擇，我們將依據毛孩特徵與你的品味，客製高畫質數位聖誕卡（適合手機傳送、社群分享或自行印製 5×7 賀卡）。單張 US\$9.99／三張組 US\$19.99，付款後由團隊依序精製並透過專屬連結交付。  
* **首屏信任微文案（Trust Micro-copy，放於 CTA 下方）**：  
  ✓ 數位高畫質 PNG 檔（非實體寄送）｜✓ 先選風格再結帳，照片可於付款後補傳｜✓ 照片僅用於本次製卡，不作公開展示

### **【英文版 English】**

* **Headline**:  
  Custom AI Pet Christmas Cards, Tailored to Your Taste  
* **Subheadline**:  
  Pick your style in 5 quick questions. We craft high-resolution digital holiday cards inspired by your pet's look and your aesthetic—ready for texting, social sharing, or home printing (5×7"). US\$9.99 for 1 card or US\$19.99 for a 3-card pack, delivered via private download link after order review.  
* **Trust Micro-copy**:  
  ✓ High-res digital download (no physical shipping) \| ✓ Upload pet photo after checkout \| ✓ Photos used strictly for your order

---

## **3.2 Quiz 題目與選項重寫（5 題高連結感、低摩擦、直接對應生圖 Prompt）**

**Quiz 引導小標**：

* 繁中：5 步設定你的專屬聖誕卡風格（完成後立即查看推薦組合）  
* 英文：5 Quick Steps to Style Your Holiday Card

### **Q1：這張卡的主角是誰？（鎖定多寵家庭與物種預期）**

* **繁中題目**：這次想讓哪位毛孩登上聖誕賀卡？  
  * A. 一隻貓咪主子（Single Cat）  
  * B. 一隻汪星人（Single Dog）  
  * C. 兩隻毛孩同框過節（Duo Pets — 限三張組或指定構圖）  
  * D. 其他可愛小寵（兔／鼠／鳥等）（Other Pet）  
* **English Question**: Who is starring on your Christmas card?  
  * A. One Cat  
  * B. One Dog  
  * C. Two Pets Together (Duo Portrait)  
  * D. Other Small Pet (Rabbit, Bird, etc.)

### **Q2：你想呈現哪一種美術畫風？（直接消除審美疑慮，建議介面搭配小縮圖）**

* **繁中題目**：你最喜歡哪一種卡片藝術風格？  
  * A. 溫暖經典油畫風（Classic Warm Oil Painting — 復古厚實筆觸，最有紀念感）  
  * B. 治癒系手繪水彩風（Cozy Watercolor Illustration — 柔和筆觸，適合印製實體賀卡）  
  * C. 歐美復古繪本版畫風（Vintage Storybook Print — 質感細膩，帶點童話氣息）  
  * D. 軟萌日系毛絨插畫風（Soft Fluffy Picture Book — 圓潤可愛、社群分享最吸睛）  
* **English Question**: Which art style fits your vibe?  
  * A. Classic Warm Oil Painting (Rich, timeless & heirloom feel)  
  * B. Cozy Watercolor Illustration (Soft, warm & print-friendly)  
  * C. Vintage Storybook Print (Nostalgic holiday charm)  
  * D. Soft Fluffy Illustration (Playful, cute & share-ready)

### **Q3：毛孩在卡片裡要做什麼？（決定場景與道具）**

* **繁中題目**：你想幫毛孩安排哪個聖誕場景？  
  * A. 壁爐旁戴著聖誕圍巾打盹（Cozy Fireside & Knit Scarf）  
  * B. 坐在閃亮聖誕樹與禮物盒堆裡（Under the Twinkling Christmas Tree）  
  * C. 漫天飄雪的歐風冬日小鎮窗邊（Snowy Window & Winter Village）  
  * D. 穿著俏皮聖誕毛衣的節慶派對（Ugly Christmas Sweater Party）  
* **English Question**: Pick a holiday scene for your pet:  
  * A. Cozy by the fireplace in a knit scarf  
  * B. Surrounded by gifts under a twinkling tree  
  * C. Looking out a snowy winter village window  
  * D. Festive party in a holiday sweater

### **Q4：卡片色調與燈光氛圍？（決定畫面質感）**

* **繁中題目**：希望整張卡片帶給收禮人什麼色調感受？  
  * A. 暖金燭光與經典聖誕紅綠（Warm Candlelight, Classic Red & Green）  
  * B. 奶油米白與松針木質調（Creamy Beige & Pinewood Minimalist）  
  * C. 午夜藍雪夜與金色星光（Midnight Blue & Golden Starlight）  
* **English Question**: Choose the color palette & mood:  
  * A. Warm candlelight, classic red & pine green  
  * B. Creamy neutrals & natural woodland tones  
  * C. Midnight winter blue & golden starlight

### **Q5：卡片預計怎麼使用？（決定構圖留白與對齊交付預期）**

* **繁中題目**：這張卡片完成後，你最想拿來做什麼？  
  * A. 留白多一點，方便自己印出來手寫祝福（Print-ready with clean margin for handwritten notes）  
  * B. 加上 "Merry Christmas" 節慶字樣，直接傳訊息或發限動（With "Merry Christmas" lettering, ready for digital sharing）  
  * C. 純粹收藏毛孩的無字藝術肖像（Clean art portrait without text）  
* **English Question**: How do you plan to use the card?  
  * A. Print it out with clean space for handwritten notes  
  * B. Share digitally with classic "Merry Christmas" lettering  
  * C. Keep as a text-free art portrait

---

## **3.3 結果頁 CTA 與承諾邊界文案**

**結果頁頂部定調（Result Header）**：

* **繁中**：  
  **你的專屬配方已就緒：{風格名稱} × {場景名稱}**  
  這組搭配能突顯毛孩的神韻與節慶溫度。我們會依據你的測驗設定，結合你提供的毛孩照片特徵進行風格化創作（AI 藝術重繪以捕捉毛色、花紋與氣質為主，非寫實修圖，亦不承諾百分之百寫真還原）。  
* **English**：  
  **Your Custom Recipe Is Ready: {Style Name} × {Scene Name}**  
  This pairing highlights your pet's personality with festive warmth. We craft your card based on your quiz choices and your pet's photo details (stylized AI artwork designed to capture coat colors, markings, and charm—not a photorealistic retouch or guaranteed 1:1 likeness).

**結果頁主／副 CTA 按鈕**：

* **主 CTA（推薦三張組）**：  
  * 繁中：`解鎖 3 張客製聖誕卡組 — US$19.99（可換不同風格／多隻毛孩）→`  
  * 英文：`Get the 3-Card Custom Pack — US$19.99 (Mix styles or pets) →`  
* **副 CTA（單張體驗）**：  
  * 繁中：`先訂製 1 張試試看 — US$9.99`  
  * 英文：`Start with 1 Custom Card — US$9.99`  
* **CTA 下方交付與安心說明（誠實不誇大）**：  
  * 繁中：`付款後再上傳照片即可，不用急著現在找圖。非即時自動生成，付款完成後我們將於 24 小時內完成製作並寄出限時下載連結（高畫質數位 PNG 檔，無實體寄送）。`  
  * 英文：`Upload your pet's photo after checkout—no rush right now. Not an instant generator: your custom digital PNG file(s) will be crafted and sent via a time-limited download link within 24 hours.`

---

## **3.4 價格呈現方式（雙方案對比與價值錨定）**

1. **單張客製卡｜Starter Single**  
   * 價格：**US\$9.99**（約 NT\$320，實際依發卡銀行匯率計價）  
   * 包含內容：  
     * 1 張高畫質數位聖誕卡（PNG，適合社群分享與 5×7 吋列印）  
     * 套用本次測驗選定的 1 組風格配方  
     * 單隻寵物主角（如需雙寵同框請選三張組）  
     * 付款後 24 小時內交付專屬下載連結（連結有效 7 天）  
2. **三張客製超值組｜Holiday Trio Pack（推薦／Most Popular）**  
   * 價格：**US\$19.99**（平均每張僅 **US\$6.66**，現省 US\$9.98｜約 NT\$645）  
   * 包含內容：  
     * 3 張高畫質數位聖誕卡（PNG，適合社群分享與 5×7 吋列印）  
     * 可自由分配給 **不同毛孩**，或同一隻毛孩 **嘗試 3 種不同聖誕風格／構圖**  
     * 支援「雙寵同框」構圖選項  
     * 付款後 24 小時內交付專屬下載連結（連結有效 7 天）

# **四、付款後自動交付訊息模板（Email ＋ 站內版，雙語）**

## **4.1 Email 交付模板（繁中＋英文雙語）**

### **【繁中版 Email】**

* **主旨**：🎄 你的毛孩聖誕卡完成囉！請於 {expires\_in} 內下載（訂單編號 \#{order\_id}）  
* **內文**：  
  哈囉 {customer\_name}，  
    
  感謝你訂製 ideal-typ

e 專屬寵物聖誕卡！我們已經根據你的風格選擇與毛孩特徵，為你製作完成這次的聖誕賀卡。

▼ 點擊下方專屬連結下載高畫質圖檔（PNG 格式）：  
{r2\_signed\_download\_url}

重要下載提醒：

1. 限時連結：為了保護你的圖片隱私，此下載連結將於 {expiry\_datetime}（約 {expires\_in} 後）失效，請儘早下載並儲存至手機或電腦。  
2. 檔案用途：內含高畫質數位 PNG 檔，可直接用於手機傳訊、社群分享，或自行送印 5×7 吋實體卡片（本商品為數位檔，無實體寄送）。  
3. 訂單規格：{plan\_name}（共 {card\_count} 張）｜風格配方：{style\_summary}

如果下載連結提前過期、打不開，或檔案有任何技術問題，請直接回覆此信並附上訂單編號 \#{order\_id}，我們會盡快協助處理。

祝你和毛孩有個溫暖的聖誕節！  
PlAIground Lab 團隊  
https\://ideal-type.plaigroundlab.com

### **【英文版 Email】**

* Subject: 🎄 Your Custom Pet Christmas Card(s) Are Ready\! Download within {expires\_in} (Order \#{order\_id})  
* Body:  
  Hi {customer\_name},  
    
  Thank you for ordering from ideal-type\! Your custom pet Christma

s card(s) have been crafted based on your style selections and your pet's photo details.

▼ Download your high-resolution digital file(s) (PNG) here:  
{r2\_signed\_download\_url}

**Important Notes:**

1. **Time-Limited Link**: To protect your privacy, this signed download link will expire on **{expiry\_datetime}** ({expires\_in}). Please download and save your files to your device right away.  
2. **File Format**: High-resolution digital PNG(s), ready for texting, social media, or self-printing up to 5×7" (digital download only; no physical item will be shipped).  
3. **Order Summary**: {plan\_name} ({card\_count} card(s)) \| Style: {style\_summary}

If your link expires before you can save your files or if you run into any technical issue, simply reply to this email with your Order ID \#{order\_id} and we'll help you out.

Wishing you and your pet a cozy holiday season\!  
PlAIground Lab  
https\://ideal-type.plaigroundlab.com

---

## **4.2 站內交付頁／訂單狀態頁模板（繁中＋英文雙語）**

### **【繁中版 站內交付頁】**

* **狀態標籤**：`已完成製作 · 可供下載`  
* **主標題**：你的專屬毛孩聖誕卡已準備就緒！  
* **說明文案**：以下為本次訂單（`#{order_id}`）的高畫質數位 PNG 成品。建議立即儲存至手機相簿或電腦資料夾。  
* **下載按鈕**：`⬇ 下載全部聖誕卡（限時連結）`  
* **期限與備忘提示框**：  
  * ⏳ **連結有效期限**：此安全下載連結將於 **{expiry\_datetime}** 自動失效（連結過期後基於隱私保護將無法直接開啟）。  
  * 📧 **備份通知**：我們也已將相同下載連結寄送至你的結帳信箱 `{customer_email}`。  
  * 💬 **需要協助？**：若檔案無法下載或需要補發連結，請來信 `{support_email}` 並提供訂單編號 `#{order_id}`。

### **【英文版 On-Site Delivery Page】**

* **Status Badge**: `Ready for Download`  
* **Headline**: Your Custom Pet Christmas Card(s) Are Ready\!  
* **Body Copy**: Here are the high-resolution digital PNG files for Order `#{order_id}`. Please save them directly to your phone or computer.  
* **Primary Button**: `⬇ Download Your Card(s) (Time-Limited Link)`  
* **Notice Callout**:  
  * ⏳ **Link Expiration**: For your privacy, this secure download link expires on **{expiry\_datetime}**.  
  * 📧 **Email Backup**: We've also sent this download link to `{customer_email}`.  
  * 💬 **Need Help?**: If your link expires or won't open, contact `{support_email}` with Order `#{order_id}`.

# **五、客製卡生成 Prompt 模板與 3 組完整範例**

## **5.1 通用 Prompt 結構化模板（Input → Output）**

### **【標準輸入 Schema（Input）】**

1. **寵物照片描述（Pet Description）**：  
   * `species_and_breed`：物種與品種（或混種特徵）  
   * `coat_color_and_markings`：毛色分佈、斑紋、臉部面具、胸口白毛、耳型等辨識特徵  
   * `expression_and_accessories`：神態（如歪頭、吐舌、高冷眼神）與原生特徵（如琥珀色大眼、垂耳）  
2. **飼主測驗選項（Owner Quiz Choices）**：  
   * `Q1_subject`：單隻／雙寵／小寵  
   * `Q2_art_style`：油畫／水彩／復古繪本／日系毛絨插畫  
   * `Q3_scene`：壁爐圍巾／聖誕樹禮物／雪窗小鎮／聖誕毛衣派對  
   * `Q4_palette_mood`：暖金紅綠／奶油木質／午夜藍星光  
   * `Q5_card_usage`：留白手寫／含 Merry Christmas 字樣／純無字藝術肖像

### **【標準輸出指令模板（Output Prompt Template）】**

```
[Subject & Pet Features]: A charming holiday portrait of {species_and_breed}, featuring {coat_color_and_markings}, with {expression_and_accessories}.
[Scene & Action]: {scene_description}, wearing/surrounded by {holiday_props}.
[Art Style & Medium]: {art_style_keywords}, rich texture, expressive yet clean brushwork, high aesthetic quality, cohesive greeting card illustration.
[Color Palette & Lighting]: {palette_mood_keywords}, soft festive lighting, gentle rim light highlighting fur texture.
[Composition & Card Framing]: Vertical 5:7 greeting card composition, centered balanced framing, {text_or_margin_instruction}.
[Quality & Guardrails]: Anatomically accurate pet limbs and paws, natural eye symmetry, no distorted faces, no extra limbs, no gibberish text, no watermarks.
```

---

## **5.2 三組完整範例輸入與輸出**

### **範例 1：橘白賓士貓 × 溫暖經典油畫風 × 含 Merry Christmas 字樣（社群分享版）**

* **輸入（Input）**：  
  * **寵物照片描述**：橘白相間短毛米克斯貓（橘色背毛與頭頂八字橘斑，白色鼻樑、下巴與白襪子），翠綠色圓眼睛，微歪頭好奇表情，圓潤臉頰。  
  * **飼主 Quiz 選項**：Q1 單貓 / Q2 溫暖經典油畫風 / Q3 壁爐旁戴著聖誕圍巾打盹（改為醒著微歪頭依偎壁爐旁） / Q4 暖金燭光與經典聖誕紅綠 / Q5 加上 "Merry Christmas" 節慶字樣  
* **輸出（Output Prompt）**：

```
A charming holiday portrait of a chubby ginger-and-white domestic shorthair cat, featuring symmetrical orange tabby markings on the forehead and back, a clean white muzzle, white chest, and white paws, with bright emerald-green round eyes and a curious slight head tilt. Sitting cozily beside a warm glowing brick fireplace, wearing a chunky hand-knitted forest green and crimson Christmas scarf, with softly blurred pine garland and brass candlesticks in the background. Classic warm oil painting style, visible rich impasto brushwork, timeless heirloom portrait texture. Warm candlelight palette with classic Christmas red and deep pine green tones, soft golden rim light illuminating the cat's whiskers and soft fur. Vertical 5:7 greeting card composition, medium close-up portrait, elegant classic gold serif lettering reading "Merry Christmas" neatly placed at the upper margin. Anatomically accurate paws and ears, natural eye symmetry, clean crisp typography, no extra limbs, no watermarks.
```

### **範例 2：奶油色貴賓犬 × 歐美復古繪本版畫風 × 留白手寫空間（實體印製版）**

* **輸入（Input）**：  
  * **寵物照片描述**：奶油杏色玩具貴賓犬，蓬鬆捲毛圓頭造型，黑亮圓鼻頭與深褐色溫柔眼睛，耳朵毛髮較長且微捲。  
  * **飼主 Quiz 選項**：Q1 單犬 / Q2 歐美復古繪本版畫風 / Q3 漫天飄雪的歐風冬日小鎮窗邊 / Q4 奶油米白與松針木質調 / Q5 留白多一點方便印出來手寫祝福  
* **輸出（Output Prompt）**：

```
A heartwarming holiday portrait of a cream-apricot toy poodle with fluffy curly fur, rounded teddy-bear head trim, long wavy ears, shiny black nose, and gentle dark brown eyes. Perched by a vintage wooden-framed window looking out at a quiet snowy European winter village with warm lit cottages, softly falling snowflakes outside, and a small sprig of pine and pinecones on the windowsill. Vintage storybook print illustration style, delicate crosshatching and fine ink-and-gouache texture, nostalgic mid-century children's book aesthetic. Creamy beige, soft snow white, and muted pinewood tones, gentle diffused winter daylight mixed with warm indoor glow. Vertical 5:7 greeting card composition, subject positioned in the upper-center two-thirds with generous clean creamy-beige negative space at the bottom border for handwritten holiday notes, no text. Anatomically accurate posture, natural fur curls, no gibberish text, no watermarks.
```

### **範例 3：雙寵（赤柴犬＋黑貓）× 治癒系手繪水彩風 × 純無字藝術肖像（三張組雙寵同框）**

* **輸入（Input）**：  
  * **寵物照片描述**：左邊為赤色柴犬（臉頰與胸口白色毛、立耳、微笑瞇眼）；右邊為全黑短毛米克斯貓（金黃色杏仁眼、細長鬍鬚、高冷端坐姿態）。  
  * **飼主 Quiz 選項**：Q1 兩隻毛孩同框 / Q2 治癒系手繪水彩風 / Q3 穿著俏皮聖誕毛衣的節慶派對 / Q4 午夜藍雪夜與金色星光 / Q5 純粹收藏毛孩的無字藝術肖像  
* **輸出（Output Prompt）**：

```
A delightful duo holiday portrait of two pets sitting side by side: on the left, a red Shiba Inu with cream-white cheeks and chest, upright pointed ears, and a cheerful squinting smile; on the right, a sleek solid black domestic shorthair cat with bright golden-amber almond eyes, sitting upright with calm poise. Both pets are dressed in matching cozy knit holiday sweaters with subtle snowflake patterns, surrounded by tiny golden star ornaments against a festive winter evening backdrop. Cozy hand-painted watercolor illustration style, soft translucent washes, delicate paper grain texture, gentle ink outlines. Midnight winter blue background accented with warm golden starlight and soft cream highlights. Vertical 5:7 greeting card composition, balanced side-by-side framing with clear separation between both pets, completely text-free art portrait. Anatomically accurate paws, ears, and tails for both pets, distinct facial features, no merged bodies, no text, no watermarks.
```

