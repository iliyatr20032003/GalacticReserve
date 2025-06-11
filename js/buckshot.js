class Shell {
    constructor(type) {
        this.type = type; // 'live' or 'blank'
    }
}

class Player {
    constructor(name) {
        this.name = name;
        this.hp = 3;
        this.items = [];
    }
}

class Game {
    constructor() {
        this.player = new Player('Player');
        this.dealer = new Player('Dealer');
        this.magazine = [];
        this.current = 0;
        this.itemPool = ['Cigarette Pack', 'Handcuffs', 'Magnifying Glass', 'Beer'];
    }

    startRound() {
        this.player.hp = 3;
        this.dealer.hp = 3;
        this.player.items = this.randomItems();
        this.dealer.items = [];
        this.magazine = this.generateLoad(4);
        this.current = 0;
        this.updateUI();
        setStatus('Round started. Your move.');
        enableControls();
    }

    randomItems() {
        const count = Math.floor(Math.random()*4)+2; //2-5
        const items = [];
        for(let i=0;i<count;i++) {
            items.push(this.itemPool[Math.floor(Math.random()*this.itemPool.length)]);
        }
        return items;
    }

    generateLoad(size) {
        const shells=[];
        let lives, blanks;
        if(size %2===0) {
            lives=blanks=size/2;
        } else {
            lives=Math.ceil(size/2);
            blanks=size-lives;
        }
        for(let i=0;i<lives;i++) shells.push(new Shell('live'));
        for(let i=0;i<blanks;i++) shells.push(new Shell('blank'));
        //shuffle
        for(let i=shells.length-1;i>0;i--) {
            const j=Math.floor(Math.random()*(i+1));
            [shells[i], shells[j]]=[shells[j], shells[i]];
        }
        return shells;
    }

    shoot(target) {
        if(this.current>=this.magazine.length) {
            setStatus('Magazine empty. Start a new round.');
            return;
        }
        const shell=this.magazine[this.current++];
        if(shell.type==='live') {
            target.hp--; setStatus(target.name+' was hit!');
        } else {
            setStatus('Click! It was blank.');
        }
        this.updateUI();
        if(this.player.hp<=0 || this.dealer.hp<=0) {
            disableControls();
            setStatus((this.player.hp>0?'You win!':'Dealer wins!')+' Start again?');
        }
    }
}

const game=new Game();
const startBtn=document.getElementById('startBtn');
const shootSelf=document.getElementById('shootSelf');
const shootDealer=document.getElementById('shootDealer');

startBtn.addEventListener('click',()=>game.startRound());
shootSelf.addEventListener('click',()=>game.shoot(game.player));
shootDealer.addEventListener('click',()=>game.shoot(game.dealer));

function updateItems(el,items) {
    el.innerHTML='';
    items.forEach((it,i)=>{
        const div=document.createElement('div');
        div.className='item';
        div.textContent=it;
        if(it==='Cigarette Pack') {
            div.addEventListener('click',()=>{
                if(game.player.items[i]!=='Cigarette Pack') return;
                game.player.hp++;
                game.player.items.splice(i,1);
                game.updateUI();
            });
        }
        if(it==='Magnifying Glass') {
            div.addEventListener('click',()=>{
                if(game.current<game.magazine.length)
                    setStatus('Next shell is '+game.magazine[game.current].type);
            });
        }
        if(it==='Beer') {
            div.addEventListener('click',()=>{
                if(game.current<game.magazine.length) {
                    game.current++; game.player.items.splice(i,1); game.updateUI();
                    setStatus('You discarded a shell.');
                }
            });
        }
        el.appendChild(div);
    });
}

function updateMagazine(el,mag,idx) {
    el.innerHTML='';
    mag.forEach((s,i)=>{
        const div=document.createElement('div');
        div.className='shell '+(i<idx?'' : 'unknown');
        if(i<idx) div.classList.add(s.type);
        el.appendChild(div);
    });
}

function enableControls() {
    shootSelf.disabled=false;
    shootDealer.disabled=false;
}
function disableControls() {
    shootSelf.disabled=true;
    shootDealer.disabled=true;
}
function setStatus(text){
    document.getElementById('status').textContent=text;
}
Game.prototype.updateUI=function(){
    document.getElementById('playerHp').textContent=this.player.hp;
    document.getElementById('dealerHp').textContent=this.dealer.hp;
    updateItems(document.getElementById('playerItems'),this.player.items);
    updateItems(document.getElementById('dealerItems'),this.dealer.items);
    updateMagazine(document.getElementById('magazine'),this.magazine,this.current);
};
