//Controller會使用的遊戲狀態
const GAME_STATE = {
  FirstCardAwaits :'FirstCardAwaits',
  SecondCardAwaits : 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished',
}


//資料結構
//卡片：四組1-13, 花色依序是 (1-13)黑桃、(14-26)紅心、(27-39)方塊、(40-52)梅花
//先宣告圖檔
const Symbol = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', //黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', //愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', //方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' //梅花
]

//把52張卡片渲染出來
//原本是一個函示包含創建資料+塞資料
//而後分成兩個函示，一個專門創建資料，一個把資料塞進selector內 displayCard 負責選出卡片並變換內容
//index為0~51

//建立卡牌&牌桌UI元素
const view = {
  getCardElement(index){
    return `<div data-index=${index} class="card back"></div>`
  },
  getCardContent(index) {
    const number = this.transfromNumber((index % 13) + 1) //有四張卡牌不是數字，需特別處理轉換
    const symbol = Symbol[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}">
      <p>${number}</p>
    </div>
    `
  },
  transfromNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  displaycards(indexes) {
    const rootElement = document.querySelector('#cardTable')
    rootElement.innerHTML = indexes.map((index) => this.getCardElement(index)).join('')
  },
  //filpCard 改為 flipCards 
  //傳入的參數使用...spread operator, 可以搜集大於一個參數
  flipCards(...cards) {
    cards.map(card => {
    //判斷是否為牌背
    if (card.classList.contains('back')) {
      //點擊覆蓋卡片，回傳number & symbol的內容
      card.classList.remove("back")
      card.innerHTML = this.getCardContent(Number(card.dataset.index))
    } //點擊打開的卡片, 回到card back狀態
    else {
      card.classList.add("back")
      card.innerHTML = null
    }
  })
},
  //當卡片被翻開時，卡片底色改為灰色
  pairCards(...cards){
    cards.map((card) => {
    card.classList.add("paired")
    })
  },
  renderScore(score){
    document.querySelector(".score").textContent = `Score: ${score}`;
  },
  renderTriedTimes(times){
    document.querySelector(".tried").textContent = `You've tried: ${times} times`;
  },
  appendWrongAnimation(...cards){
    cards.map(card => {
      card.classList.add("wrong")
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), 
      {once:true} //確保事件只會被監聽過一次
    )})
  },
  showCelebrationPopup(){
    document.querySelector("#celebration").classList.add("popupeffect")
    document.querySelector("#celebration p").style.display = 'block'
  }

}

const model = {
  revealedCards :[] ,  //被翻開的卡片 想像：搜集被翻開的卡片的花色跟數字

  //檢查配對成功的函式   //******等一下回來研究為什麼這裡要dataset.index */
  isRevealedCardsMatched(){
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score : 0,
  triedTimes : 0
}


//流程控制器，依遊戲狀態來分配動作
//view跟model 或其他元件都要等controller來呼叫時，才會動作
const controller = {
  currentState: GAME_STATE.FirstCardAwaits, //加在第一行

  generateCards() {
    view.displaycards(utility.getRandomNumberArray(52))
  },

  //中樞系統
  dispatchCardAction(card){
    //判斷，如果是正面已經翻開了，就不能點
    if(!card.classList.contains("back")){
      return
    } //背面等待點擊，點完要處理的動作
    switch (this.currentState){
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break;

      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)  //在進行renderTriedTimes前要再加一
        view.flipCards(card)
        model.revealedCards.push(card)
        //判斷是否有配對成功
        
        if (model.isRevealedCardsMatched()){
          //先做加分
          view.renderScore(model.score += 10)
          //檢測是否達到260分
          if (model.score === 260){
            console.log("hit the score!260!")
            view.showCelebrationPopup() 
            this.currentState = GAME_STATE.GameFinished
            break
          } else {
          this.currentState = GAME_STATE.CardsMatched //狀態更新：配對成功
          view.pairCards(...model.revealedCards) //卡片翻著，背景改為灰色
          model.revealedCards = []
          this.currentState = GAME_STATE.FirstCardAwaits
          } 
        } else {
          //配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          //1000毫秒後執行以下function
          setTimeout(this.resetCards,1000)
        } 
        console.log(this.currentState)
        console.log(model.revealedCards)
        break
        }
    },

  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits  
  }
  }

//洗牌，按下重新整理，就會return一串重新整理完成後的[0~51]新陣列
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys()) //[0,1,2,3,4]
    for (let index = number.length - 1; index > 0; index--) {
      let RandomIndex = Math.floor(Math.random() * index); //3
      [number[index], number[RandomIndex]] = [number[RandomIndex], number[index]]
    }
    return number
  }
}

//呼叫
controller.generateCards()

// 動作：偵測牌面被點擊
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", event => {
    controller.dispatchCardAction(card)
  })
})