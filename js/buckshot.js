class Shell {
    constructor(type) {
        this.type = type; // 'live' or 'blank'
    }
}

class Player {
    constructor(name) {
        this.name = name;
        this.hp = 3;
        this.maxHp = 3;
        this.items = [];
        this.damageBoost = 1; // multiplier for next live shot
    }
}

class Game {
    constructor() {
        this.player = new Player('Player');
        this.dealer = new Player('Dealer');
        this.magazine = [];
        this.current = 0;
        this.round = 0;
        this.bank = 0;
        this.basicItems = [
            "Cigarette Pack",
            "Handcuffs",
            "Magnifying Glass",
            "Beer",
            "Hand Saw"
        ];
        this.extraItems = ["Inverter", "Expired Medicine", "Adrenaline", "Burner Phone"];
        // enable advanced items by default
        this.doubleMode = true;
        this.itemPool = this.basicItems.slice();
        this.knownShell = null; // dealer knowledge of next shell
        this.dealerSkip = 0; // number of dealer turns to skip
        this.playerSkip = 0; // number of player turns to skip
        this.seed = Date.now();
        this.animationSpeed = 1;
        this.dealerDelay = 2; // delay before dealer acts in seconds
        this.showIndicator = true; // display shell counter
        this.keepMagnify = false; // debug: keep magnifying glass after use
        this.keepCigarette = false; // debug: keep cigarette pack after use
        this.playerKnown = {}; // indices of shells revealed to the player
        this.dealerKnown = {}; // indices of shells revealed to the dealer
        this.freezeIndicator = false; // freeze shell counter display
        this.cachedLives = 0;
        this.cachedBlanks = 0;
        this.isPlayerTurn = true; // track whose turn it is
    }

    setSeed(seed) {
        if(!Number.isFinite(seed)) return;
        this.seed = seed;
    }

    random() {
        // simple deterministic PRNG (LCG)
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    sleep(ms){
        return new Promise(resolve=>setTimeout(resolve, ms));
    }

    setTurn(isPlayer){
        this.isPlayerTurn = isPlayer;
        this.updateUI();
    }

    updateItemPool() {
        this.itemPool = this.basicItems.slice();
        if(this.doubleMode) this.itemPool = this.itemPool.concat(this.extraItems);
    }

    startRound() {
        this.round++;
        const seedInput = document.getElementById('seedInput');
        if(seedInput && seedInput.value) this.setSeed(Number(seedInput.value));
        const hp = 2 + Math.floor(this.random() * 3); // 2-4
        this.player.hp = this.player.maxHp = hp;
        this.dealer.hp = this.dealer.maxHp = hp;
        this.player.damageBoost = 1;
        this.dealer.damageBoost = 1;
        this.updateItemPool();
        this.player.items = this.randomItems();
        this.dealer.items = this.randomItems();
        const magazineSize = 2 + Math.floor(this.random()*7); // 2-8
        this.magazine = this.generateLoad(magazineSize);
        this.current = 0;
        this.knownShell = null;
        this.dealerSkip = 0;
        this.playerSkip = 0;
        this.playerKnown = {};
        this.dealerKnown = {};
        this.freezeIndicator = false;
        this.isPlayerTurn = true;
        this.updateUI();
        setStatus('Round '+this.round+' started. Your move.');
        enableControls();
        startBtn.textContent = 'Restart Round';
    }

    randomItems() {
        const count = Math.floor(this.random()*4)+2; //2-5
        const items = [];
        for(let i=0;i<count;i++) {
            items.push(this.itemPool[Math.floor(this.random()*this.itemPool.length)]);
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
            const j=Math.floor(this.random()*(i+1));
            [shells[i], shells[j]]=[shells[j], shells[i]];
        }
        return shells;
    }

    reloadMagazine() {
        this.player.damageBoost = 1;
        this.dealer.damageBoost = 1;
        this.freezeIndicator = false;
        this.updateItemPool();
        this.player.items = this.player.items.concat(this.randomItems()).slice(0,8);
        this.dealer.items = this.dealer.items.concat(this.randomItems()).slice(0,8);
        const magazineSize = 2 + Math.floor(this.random()*7); // 2-8
        this.magazine = this.generateLoad(magazineSize);
        this.current = 0;
        this.knownShell = null;
        this.dealerSkip = 0;
        this.playerSkip = 0;
        this.playerKnown = {};
        this.dealerKnown = {};
        this.updateUI();
        setStatus('New magazine loaded.');
    }

    endRound(winner) {
        disableControls();
        if(winner === this.player) {
            this.bank += this.player.hp;
        }
        if(this.doubleMode && this.round % 3 === 0) {
            this.bank *= 2;
        }
        this.updateUI();
        if(!this.doubleMode && this.round >= 3 && winner === this.player) {
            setStatus('Story complete! Final bank: '+this.bank+'. Start again?');
            startBtn.textContent = 'Start Round';
            this.round = 0;
            this.bank = 0;
        } else {
            setStatus((winner===this.player?'You win this round!':'Dealer wins the round!')+' Start next round.');
            startBtn.textContent = 'Next Round';
        }
    }

    shoot(target, shooter = target) {
        if(this.current>=this.magazine.length) {
            this.reloadMagazine();
        }
        const shell=this.magazine[this.current++];
        this.freezeIndicator = false;
        if(shell.type==='live') {
            target.hp -= shooter.damageBoost;
            if(target.hp < 0) target.hp = 0;
            setStatus(shooter.name+' shot '+target.name+'!');
        } else {
            setStatus(shooter.name+' fired a blank.');
        }
        shooter.damageBoost = 1;
        this.updateUI();
        if(this.player.hp<=0 || this.dealer.hp<=0) {
            const winner = this.player.hp>0 ? this.player : this.dealer;
            this.endRound(winner);
            return;
        }
        if(this.current>=this.magazine.length){
            if(this.player.hp>0 && this.dealer.hp>0){
                this.reloadMagazine();
            } else {
                this.endRound(this.player.hp>this.dealer.hp?this.player:this.dealer);
            }
        }
        return shell.type;
    }

    async dealerTurn() {
        this.setTurn(false);
        if(this.dealerSkip > 0) {
            setStatus('Dealer is restrained and loses a turn.');
            this.dealerSkip--;
            await this.sleep(this.dealerDelay*1000);
            this.setTurn(true);
            if(this.player.hp>0 && this.dealer.hp>0) setStatus('Your move.');
            return;
        }
        // restrain player if possible
        const cuffsIndex = this.dealer.items.indexOf('Handcuffs');
        if(cuffsIndex > -1) {
            this.playerSkip += 1;
            this.dealer.items.splice(cuffsIndex,1);
            this.updateUI();
            setStatus('Dealer uses Handcuffs on you.');
            await this.sleep(this.dealerDelay*1000);
        }
        // heal if low hp
        const cigIndex = this.dealer.items.indexOf('Cigarette Pack');
        if(this.dealer.hp <= 2 && cigIndex > -1) {
            this.dealer.hp++;
            this.dealer.hp = Math.min(this.dealer.hp, this.dealer.maxHp);
            this.dealer.items.splice(cigIndex,1);
            this.updateUI();
            setStatus('Dealer uses a Cigarette Pack.');
            await this.sleep(this.dealerDelay*1000);
        }
        const medIndex = this.dealer.items.indexOf('Expired Medicine');
        if(medIndex > -1 && this.dealer.hp < this.dealer.maxHp) {
            this.dealer.items.splice(medIndex,1);
            if(this.random() < 0.5) {
                this.dealer.hp += 2;
                this.dealer.hp = Math.min(this.dealer.hp, this.dealer.maxHp);
                setStatus('Dealer heals with Expired Medicine.');
            } else {
                this.dealer.hp -= 1;
                if(this.dealer.hp < 0) this.dealer.hp = 0;
                setStatus('Dealer is hurt by Expired Medicine.');
            }
            this.updateUI();
            await this.sleep(this.dealerDelay*1000);
        }
        const adIndex = this.dealer.items.indexOf('Adrenaline');
        if(adIndex > -1 && this.player.items.length>0){
            this.dealer.items.splice(adIndex,1);
            applyItemEffect(this.dealer,'Adrenaline');
            await this.sleep(this.dealerDelay*1000);
        }
        const phoneIndex = this.dealer.items.indexOf('Burner Phone');
        if(phoneIndex > -1){
            this.dealer.items.splice(phoneIndex,1);
            applyItemEffect(this.dealer,'Burner Phone');
            await this.sleep(this.dealerDelay*1000);
        }
        // look ahead if unknown
        if(this.knownShell === null) {
            const magIndex = this.dealer.items.indexOf('Magnifying Glass');
            if(magIndex > -1 && this.current < this.magazine.length) {
                this.knownShell = this.magazine[this.current].type;
                this.dealer.items.splice(magIndex,1);
                this.updateUI();
                setStatus('Dealer inspects the next shell.');
                await this.sleep(this.dealerDelay*1000);
            }
        }
        if(this.current >= this.magazine.length) {
            this.reloadMagazine();
        }
        let nextType = this.knownShell || this.magazine[this.current].type;
        const invIndex = this.dealer.items.indexOf('Inverter');
        if(nextType === 'blank' && invIndex > -1) {
            const remain=this.magazine.slice(this.current);
            this.cachedLives=remain.filter(s=>s.type==='live').length;
            this.cachedBlanks=remain.filter(s=>s.type==='blank').length;
            this.freezeIndicator=true;
            this.magazine[this.current].type = 'live';
            nextType = 'live';
            this.dealer.items.splice(invIndex,1);
            this.updateUI();
            setStatus('Dealer inverts the next shell.');
            await this.sleep(this.dealerDelay*1000);
        }
        if(nextType === 'blank') {
            const beerIndex = this.dealer.items.indexOf('Beer');
            if(beerIndex > -1) {
                this.dealer.items.splice(beerIndex,1);
                this.current++;
                this.freezeIndicator=false;
                this.knownShell = null;
                this.updateUI();
                setStatus('Dealer discards a shell.');
                await this.sleep(this.dealerDelay*1000);
                this.setTurn(true);
                if(this.player.hp>0 && this.dealer.hp>0) setStatus('Your move.');
                return;
            } else {
                this.knownShell = null;
                this.shoot(this.dealer, this.dealer);
                if(this.playerSkip > 0) {
                    this.playerSkip++;
                    this.updateUI();
                }
                await this.sleep(this.dealerDelay*1000);
                this.setTurn(true);
                if(this.player.hp>0 && this.dealer.hp>0) setStatus('Your move.');
                return;
            }
        } else {
            this.knownShell = null;
            const sawIndex = this.dealer.items.indexOf('Hand Saw');
            if(sawIndex > -1) {
                this.dealer.items.splice(sawIndex,1);
                this.dealer.damageBoost = 2;
                this.updateUI();
                setStatus('Dealer sharpens a Hand Saw.');
                await this.sleep(this.dealerDelay*1000);
            }
            this.shoot(this.player, this.dealer);
            await this.sleep(this.dealerDelay*1000);
            this.setTurn(true);
            if(this.player.hp>0 && this.dealer.hp>0) setStatus('Your move.');
        }
    }
}

const game=new Game();
const startBtn=document.getElementById('startBtn');
const shootSelf=document.getElementById('shootSelf');
const shootDealer=document.getElementById('shootDealer');
const settingsBtn=document.getElementById('settingsButton');
const settingsModal=document.getElementById('settingsModal');
const colorblindToggle=document.getElementById('colorblindToggle');
const keepMagToggle=document.getElementById('keepMagToggle');
const keepCigToggle=document.getElementById('keepCigToggle');
const speedRange=document.getElementById('speedRange');
const speedDisplay=document.getElementById('speedDisplay');
const delayRange=document.getElementById('delayRange');
const delayDisplay=document.getElementById('delayDisplay');
const adrenalineModal=document.getElementById('adrenalineModal');
const adrenalineItems=document.getElementById('adrenalineItems');
const adrenalineTimer=document.getElementById('adrenalineTimer');
const indicatorToggle=document.getElementById('indicatorToggle');

const doubleModeToggle=document.getElementById("doubleModeToggle");
if(colorblindToggle){
    colorblindToggle.addEventListener('change',()=>{
        document.querySelector('.bs-container').classList.toggle('colorblind', colorblindToggle.checked);
    });
}
if(keepMagToggle){
    game.keepMagnify = keepMagToggle.checked;
    keepMagToggle.addEventListener('change',()=>{
        game.keepMagnify = keepMagToggle.checked;
    });
}
if(keepCigToggle){
    game.keepCigarette = keepCigToggle.checked;
    keepCigToggle.addEventListener('change',()=>{
        game.keepCigarette = keepCigToggle.checked;
    });
}
if(speedRange){
    speedRange.addEventListener('input',()=>{
        game.animationSpeed=parseFloat(speedRange.value);
        if(speedDisplay) speedDisplay.textContent=speedRange.value+'x';
    });
    if(speedDisplay) speedDisplay.textContent=speedRange.value+'x';
}
if(delayRange){
    delayRange.addEventListener('input',()=>{
        game.dealerDelay=parseFloat(delayRange.value);
        if(delayDisplay) delayDisplay.textContent=delayRange.value+'s';
    });
    if(delayDisplay) delayDisplay.textContent=delayRange.value+'s';
    game.dealerDelay=parseFloat(delayRange.value);
}
if(doubleModeToggle){
    game.doubleMode = doubleModeToggle.checked;
    doubleModeToggle.addEventListener("change",()=>{
        game.doubleMode = doubleModeToggle.checked;
    });
}
if(indicatorToggle){
    game.showIndicator = indicatorToggle.checked;
    indicatorToggle.addEventListener('change',()=>{
        game.showIndicator = indicatorToggle.checked;
        game.updateUI();
    });
}

startBtn.addEventListener('click',()=>game.startRound());
if(settingsBtn){
    settingsBtn.addEventListener('click',()=>{
        settingsModal.style.display='flex';
    });
}
shootSelf.addEventListener('click',()=>{
    if(!game.isPlayerTurn) return;
    if(game.playerSkip > 0){
        game.setTurn(false);
        setStatus('You are restrained and lose a turn.');
        game.playerSkip--;
        setTimeout(()=>game.dealerTurn(),game.dealerDelay*1000);
        return;
    }
    game.setTurn(false);
    if(window.buckshotScene){
        window.buckshotScene.triggerShot('self');
    }
    const result = game.shoot(game.player, game.player);
    if(result === 'blank') {
        if(game.dealerSkip > 0) {
            game.dealerSkip++;
            game.updateUI();
        }
        // player keeps the turn on a blank
        if(game.player.hp>0 && game.dealer.hp>0) game.setTurn(true);
    } else if(game.player.hp>0 && game.dealer.hp>0 &&
              game.current < game.magazine.length) {
        setTimeout(()=>game.dealerTurn(),game.dealerDelay*1000);
    }
});
shootDealer.addEventListener('click',()=>{
    if(!game.isPlayerTurn) return;
    if(game.playerSkip > 0){
        game.setTurn(false);
        setStatus('You are restrained and lose a turn.');
        game.playerSkip--;
        setTimeout(()=>game.dealerTurn(),game.dealerDelay*1000);
        return;
    }
    game.setTurn(false);
    if(window.buckshotScene){
        window.buckshotScene.triggerShot('dealer');
    }
    game.shoot(game.dealer, game.player);
    if(game.player.hp>0 && game.dealer.hp>0) setTimeout(()=>game.dealerTurn(),game.dealerDelay*1000);
});

function updateItems(el,items,interactive=false) {
    el.innerHTML='';
    items.forEach((it,i)=>{
        const div=document.createElement('div');
        div.className='item';
        div.textContent=it;

        if(interactive && game.isPlayerTurn && game.playerSkip === 0){
            if(it==='Cigarette Pack') {
                div.addEventListener('click',()=>{
                    if(game.player.items[i]!=='Cigarette Pack') return;
                    game.player.hp++;
                    game.player.hp = Math.min(game.player.hp, game.player.maxHp);
                    if(!game.keepCigarette) game.player.items.splice(i,1);
                    game.updateUI();
                });
            }
            if(it==='Magnifying Glass') {
                div.addEventListener('click',()=>{
                    if(game.player.items[i]!=='Magnifying Glass') return;
                    if(game.current<game.magazine.length) {
                        const type = game.magazine[game.current].type;
                        setStatus('Next shell is '+type);
                        game.playerKnown[game.current] = type;
                        if(!game.keepMagnify) game.player.items.splice(i,1);
                        game.updateUI();
                    }
                });
            }
            if(it==='Beer') {
                div.addEventListener('click',()=>{
                    if(game.current<game.magazine.length) {
                        game.current++;
                        game.freezeIndicator=false;
                        game.player.items.splice(i,1);
                        game.updateUI();
                        setStatus('You discarded a shell.');
                    }
                });
            }
            if(it==='Handcuffs') {
                div.addEventListener('click',()=>{
                    if(game.player.items[i]!=='Handcuffs') return;
                    game.dealerSkip += 1;
                    game.player.items.splice(i,1);
                    game.updateUI();
                    setStatus('Dealer will miss their next turn.');
                });
            }
            if(it==='Hand Saw') {
                div.addEventListener('click',()=>{
                    if(game.player.items[i]!=='Hand Saw') return;
                    game.player.damageBoost = 2;
                    game.player.items.splice(i,1);
                    game.updateUI();
                    setStatus('Your next shot will deal double damage.');
                });
            }
            if(it==='Inverter') {
                div.addEventListener('click',()=>{
                    if(game.current<game.magazine.length){
                        const remain=game.magazine.slice(game.current);
                        game.cachedLives=remain.filter(s=>s.type==='live').length;
                        game.cachedBlanks=remain.filter(s=>s.type==='blank').length;
                        const s=game.magazine[game.current];
                        s.type = s.type==='live'?'blank':'live';
                        game.freezeIndicator=true;
                        game.player.items.splice(i,1);
                        game.updateUI();
                        setStatus('You inverted the next shell.');
                    }
                });
            }
            if(it==='Adrenaline') {
                div.addEventListener('click',()=>{
                    if(game.player.items[i]!=='Adrenaline') return;
                    game.player.items.splice(i,1);
                    game.updateUI();
                    applyItemEffect(game.player,'Adrenaline');
                });
            }
            if(it==='Burner Phone') {
                div.addEventListener('click',()=>{
                    if(game.player.items[i]!=='Burner Phone') return;
                    game.player.items.splice(i,1);
                    applyItemEffect(game.player,'Burner Phone');
                });
            }
            if(it==='Expired Medicine') {
                div.addEventListener('click',()=>{
                    if(game.player.items[i]!=='Expired Medicine') return;
                    game.player.items.splice(i,1);
                    applyItemEffect(game.player,'Expired Medicine');
                });
            }
        }
        el.appendChild(div);
    });
}

function updateMagazine(el,mag,idx,known) {
    el.innerHTML='';
    mag.forEach((s,i)=>{
        const div=document.createElement('div');
        div.classList.add('shell');
        if(i===idx) div.classList.add('current');
        if(i<idx) {
            div.classList.add(s.type);
        } else if(known && known[i]) {
            div.classList.add(known[i]);
        } else {
            div.classList.add('unknown');
        }
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
    const sceneStatus = document.getElementById('sceneStatus');
    if(sceneStatus){
        sceneStatus.textContent = text;
    }
}
Game.prototype.updateUI=function(){
    document.getElementById('playerHp').textContent=this.player.hp;
    document.getElementById('dealerHp').textContent=this.dealer.hp;
    const pBar=document.getElementById('playerHpBar');
    const dBar=document.getElementById('dealerHpBar');
    if(pBar){
        pBar.style.width=(100*this.player.hp/this.player.maxHp)+'%';
    }
    if(dBar){
        dBar.style.width=(100*this.dealer.hp/this.dealer.maxHp)+'%';
    }
    updateItems(document.getElementById('playerItems'),this.player.items,true);
    updateItems(document.getElementById('dealerItems'),this.dealer.items,false);
    updateMagazine(document.getElementById('magazine'),this.magazine,this.current,this.playerKnown);
    const roundEl = document.getElementById('roundNum');
    const bankEl = document.getElementById('bankAmount');
    if(roundEl) roundEl.textContent = this.round;
    if(bankEl) bankEl.textContent = this.bank;
    const indicator = document.getElementById('shellIndicator');
    if(indicator){
        let lives, blanks;
        if(this.freezeIndicator){
            lives=this.cachedLives;
            blanks=this.cachedBlanks;
        }else{
            const remaining=this.magazine.slice(this.current);
            lives=remaining.filter(s=>s.type==='live').length;
            blanks=remaining.filter(s=>s.type==='blank').length;
            this.cachedLives=lives;
            this.cachedBlanks=blanks;
        }
        indicator.textContent=`Live: ${lives} Blank: ${blanks}`;
        indicator.style.display=this.showIndicator?'block':'none';
    }
    const pcuffs=document.getElementById('playerCuffs');
    const dcuffs=document.getElementById('dealerCuffs');
    if(pcuffs) pcuffs.style.display=this.playerSkip>0?'inline':'none';
    if(dcuffs) dcuffs.style.display=this.dealerSkip>0?'inline':'none';
    if(window.buckshotScene){
        window.buckshotScene.updateFromGame(this);
    }
};

function applyItemEffect(user,item){
    const isPlayer = user === game.player;
    const opponent = isPlayer ? game.dealer : game.player;
    switch(item){
        case 'Cigarette Pack':
            user.hp++;
            user.hp = Math.min(user.hp, user.maxHp);
            break;
        case 'Handcuffs':
            if(isPlayer) game.dealerSkip += 1; else game.playerSkip += 1;
            break;
        case 'Magnifying Glass':
            if(game.current < game.magazine.length){
                const type = game.magazine[game.current].type;
                setStatus((isPlayer?'Next shell is ':'Dealer sees next shell is ')+type);
                if(isPlayer) game.playerKnown[game.current] = type; else game.dealerKnown[game.current] = type;
            }
            break;
        case 'Beer':
            if(game.current < game.magazine.length){
                game.current++;
                game.freezeIndicator=false;
                setStatus((isPlayer?'You':'Dealer')+' discarded a shell.');
            }
            break;
        case 'Hand Saw':
            user.damageBoost = 2;
            setStatus((isPlayer?'Your':'Dealer\'s')+' next shot will deal double damage.');
            break;
        case 'Inverter':
            if(game.current < game.magazine.length){
                const remain=game.magazine.slice(game.current);
                game.cachedLives=remain.filter(s=>s.type==='live').length;
                game.cachedBlanks=remain.filter(s=>s.type==='blank').length;
                const s = game.magazine[game.current];
                s.type = s.type==='live'?'blank':'live';
                game.freezeIndicator=true;
                setStatus((isPlayer?'You':'Dealer')+' inverted the next shell.');
            }
            break;
        case 'Expired Medicine':
            if(game.random()<0.5){
                user.hp += 2;
                user.hp = Math.min(user.hp, user.maxHp);
                setStatus((isPlayer?'Expired Medicine healed you.':'Dealer heals with Expired Medicine.'));
            }else{
                user.hp -= 1;
                if(user.hp < 0) user.hp = 0;
                setStatus((isPlayer?'Expired Medicine hurt you.':'Dealer is hurt by Expired Medicine.'));
            }
            break;
       case 'Burner Phone':
           if(game.current < game.magazine.length-1){
               const pos = game.current + 1 + Math.floor(game.random()*(game.magazine.length - game.current -1));
               const type = game.magazine[pos].type;
                setStatus((isPlayer?'Burner Phone':'Dealer\'s Burner Phone')+' reveals shell '+(pos+1)+' is '+type+'.');
                if(isPlayer) game.playerKnown[pos] = type; else game.dealerKnown[pos] = type;
            }else{
                setStatus(isPlayer?'No future shells to scan.':'Dealer finds no future shells.');
            }
            break;
        case 'Adrenaline':
            if(opponent.items.length>0){
                if(isPlayer){
                    showAdrenalineMenu(user, opponent);
                }else{
                    const idx = Math.floor(game.random()*opponent.items.length);
                    const stolen = opponent.items.splice(idx,1)[0];
                    setStatus('Dealer steals '+stolen+' using Adrenaline.');
                    applyItemEffect(user, stolen);
                }
            }else{
                setStatus(isPlayer?'Dealer has no items to steal.':'You have no items left to steal.');
            }
            break;
    }
    game.updateUI();
    if(user.hp <= 0){
        game.endRound(opponent);
    }
}

let adrenalineInterval;
function showAdrenalineMenu(user, opponent){
    adrenalineItems.innerHTML='';
    adrenalineModal.style.display='flex';
    let remaining=10;
    adrenalineTimer.textContent=remaining;
    adrenalineInterval=setInterval(()=>{
        remaining--;
        adrenalineTimer.textContent=remaining;
        if(remaining<=0){
            clearInterval(adrenalineInterval);
            adrenalineModal.style.display='none';
            const idx=Math.floor(game.random()*opponent.items.length);
            const stolen=opponent.items.splice(idx,1)[0];
            setStatus('Time up! You automatically steal '+stolen+'.');
            applyItemEffect(user, stolen);
        }
    },1000);
    opponent.items.forEach((it,i)=>{
        const div=document.createElement('div');
        div.className='item';
        div.textContent=it;
        div.addEventListener('click',()=>{
            clearInterval(adrenalineInterval);
            adrenalineModal.style.display='none';
            const stolen=opponent.items.splice(i,1)[0];
            setStatus('You steal '+stolen+' using Adrenaline.');
            applyItemEffect(user, stolen);
        });
        adrenalineItems.appendChild(div);
    });
}

function initBuckshotScene(){
    if(!window.THREE) return;
    const canvas = document.getElementById('buckshotScene');
    if(!canvas) return;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0d0707, 8, 22);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 4, 9);

    const ambient = new THREE.AmbientLight(0x5a3b3b, 0.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffc4a1, 1.2);
    keyLight.position.set(3, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xff6d6d, 0.6, 20);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    const wallTexture = createTiledTexture('#4a3a34', '#2b1d1d', 40);
    const floorTexture = createTiledTexture('#3a2f2a', '#151010', 32);
    const ceilingTexture = createTiledTexture('#4f3f39', '#1e1414', 36);

    const wallMat = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.95,
        metalness: 0.05
    });
    const floorMat = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.85,
        metalness: 0.1
    });
    const ceilingMat = new THREE.MeshStandardMaterial({
        map: ceilingTexture,
        roughness: 0.9,
        metalness: 0.05
    });

    const roomSize = 12;
    const wallGeo = new THREE.BoxGeometry(roomSize, 6, 0.4);
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 2.8, -5);
    roomGroup.add(backWall);

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-5.8, 2.8, 0);
    roomGroup.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(5.8, 2.8, 0);
    roomGroup.add(rightWall);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    roomGroup.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomSize, roomSize), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 5.6;
    roomGroup.add(ceiling);

    const tableTexture = createGrimeTexture('#4c3e31', '#2a1c16');
    const tableMat = new THREE.MeshStandardMaterial({
        map: tableTexture,
        roughness: 0.8,
        metalness: 0.2
    });
    const table = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.4, 4.2), tableMat);
    table.position.set(0, 1.1, 0.2);
    scene.add(table);

    const tableTop = new THREE.Mesh(
        new THREE.BoxGeometry(6.4, 0.12, 3.8),
        new THREE.MeshStandardMaterial({
            map: createGrimeTexture('#5b5441', '#2e2a20'),
            roughness: 0.75,
            metalness: 0.05
        })
    );
    tableTop.position.set(0, 1.32, 0.2);
    scene.add(tableTop);

    const feltLines = new THREE.Group();
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf2e6d1 });
    const lineGeo = new THREE.PlaneGeometry(5.2, 0.05);
    const line1 = new THREE.Mesh(lineGeo, lineMat);
    line1.rotation.x = -Math.PI / 2;
    line1.position.set(0, 1.39, 0.2);
    const line2 = line1.clone();
    line2.rotation.z = Math.PI / 2;
    const centerCircle = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 1.25, 64),
        lineMat
    );
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.set(0, 1.39, 0.2);
    feltLines.add(line1, line2, centerCircle);
    scene.add(feltLines);

    const shotgun = new THREE.Group();
    const barrelMat = new THREE.MeshStandardMaterial({
        color: 0x3a2b26,
        roughness: 0.4,
        metalness: 0.6
    });
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 4.6, 28), barrelMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.8, 1.62, 0.48);
    shotgun.add(barrel);

    const rib = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.03, 0.08), barrelMat);
    rib.position.set(0.8, 1.68, 0.48);
    shotgun.add(rib);

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.4), new THREE.MeshStandardMaterial({
        color: 0x2c221e,
        roughness: 0.5,
        metalness: 0.5
    }));
    receiver.position.set(-0.2, 1.55, 0.48);
    shotgun.add(receiver);

    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.38), new THREE.MeshStandardMaterial({
        color: 0x5b3a2d,
        roughness: 0.8,
        metalness: 0.1
    }));
    pump.position.set(0.5, 1.5, 0.48);
    shotgun.add(pump);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.32, 0.46), new THREE.MeshStandardMaterial({
        color: 0x4b2f23,
        roughness: 0.85,
        metalness: 0.05
    }));
    stock.position.set(-1.4, 1.48, 0.48);
    shotgun.add(stock);

    const butt = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.34, 0.48), new THREE.MeshStandardMaterial({
        color: 0x241510,
        roughness: 0.9,
        metalness: 0.05
    }));
    butt.position.set(-2.1, 1.48, 0.48);
    shotgun.add(butt);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.35), new THREE.MeshStandardMaterial({
        color: 0x3a261d,
        roughness: 0.85,
        metalness: 0.1
    }));
    grip.position.set(-0.7, 1.35, 0.48);
    shotgun.add(grip);

    shotgun.rotation.y = -0.35;
    shotgun.position.set(0.2, 0.3, -0.35);
    scene.add(shotgun);

    const shellsGroup = new THREE.Group();
    const shellMat = new THREE.MeshStandardMaterial({ color: 0x8d3a2a, roughness: 0.6 });
    for(let i=0;i<3;i++){
        const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16), shellMat);
        shell.rotation.z = Math.PI / 2;
        shell.position.set(-0.4 + i * 0.6, 1.55, -0.6);
        shellsGroup.add(shell);
    }
    scene.add(shellsGroup);

    const dealer = new THREE.Group();
    const dealerMat = new THREE.MeshStandardMaterial({
        color: 0x0d0b0b,
        roughness: 1,
        metalness: 0
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 2.2, 20), dealerMat);
    body.position.set(0, 2.6, -2.4);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 24), dealerMat);
    head.position.set(0, 3.9, -2.4);
    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.8), dealerMat);
    shoulders.position.set(0, 3.4, -2.4);
    dealer.add(body, head, shoulders);
    scene.add(dealer);

    const lightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.2, 1),
        new THREE.MeshStandardMaterial({ color: 0x1a1414, roughness: 0.6 })
    );
    lightPanel.position.set(0, 5.1, 0);
    scene.add(lightPanel);

    const panelLight = new THREE.PointLight(0xffd6b5, 0.6, 12);
    panelLight.position.set(0, 5, 0);
    scene.add(panelLight);

    const facePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 1.4),
        new THREE.MeshStandardMaterial({
            map: createDealerFaceTexture('neutral'),
            transparent: true
        })
    );
    facePlane.position.set(0, 3.45, -2.05);
    scene.add(facePlane);

    const muzzleFlash = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.6),
        new THREE.MeshBasicMaterial({
            color: 0xffc47a,
            transparent: true,
            opacity: 0
        })
    );
    muzzleFlash.position.set(1.8, 1.7, 0.55);
    muzzleFlash.rotation.y = -0.6;
    scene.add(muzzleFlash);

    let targetX = 0;
    let targetY = 0;
    const sceneWrapper = canvas.parentElement;
    if(sceneWrapper){
        sceneWrapper.addEventListener('mousemove', (event)=>{
            const rect = sceneWrapper.getBoundingClientRect();
            targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.4;
            targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.3;
        });
        sceneWrapper.addEventListener('mouseleave', ()=>{
            targetX = 0;
            targetY = 0;
        });
    }

    const clock = new THREE.Clock();
    let recoil = 0;
    let recoilVelocity = 0;
    let flashTimer = 0;
    let pendingExpression = null;
    function resize(){
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const renderScale = 0.7;
        renderer.setSize(width * renderScale, height * renderScale, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    function animate(){
        const elapsed = clock.getElapsedTime();
        const flicker = 0.9 + Math.sin(elapsed * 4) * 0.05;
        keyLight.intensity = 1.1 * flicker;
        rimLight.intensity = 0.5 + Math.sin(elapsed * 3.5 + 1.2) * 0.08;
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (4 + targetY - camera.position.y) * 0.05;
        camera.lookAt(0, 1.4, 0);
        recoilVelocity *= 0.88;
        recoil += recoilVelocity;
        recoil *= 0.9;
        shotgun.position.z = -0.4 + recoil;
        shotgun.rotation.z = -0.05 + recoil * 0.2;
        if(flashTimer > 0){
            flashTimer -= clock.getDelta();
            muzzleFlash.material.opacity = Math.min(1, flashTimer * 8);
        }else{
            muzzleFlash.material.opacity = 0;
        }
        if(pendingExpression){
            facePlane.material.map = createDealerFaceTexture(pendingExpression);
            facePlane.material.map.needsUpdate = true;
            pendingExpression = null;
        }
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();

    window.buckshotScene = {
        triggerShot(target){
            recoilVelocity = -0.08;
            flashTimer = 0.12;
            if(target === 'dealer'){
                pendingExpression = 'angry';
            }else{
                pendingExpression = 'grin';
            }
        },
        updateFromGame(state){
            if(!state) return;
            if(state.dealer.hp <= 1){
                pendingExpression = 'angry';
            }else if(state.player.hp <= 1){
                pendingExpression = 'grin';
            }else{
                pendingExpression = 'neutral';
            }
        }
    };
}

function createGrimeTexture(baseColor, grimeColor){
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);
    for(let i=0;i<4000;i++){
        const x = Math.random() * size;
        const y = Math.random() * size;
        const alpha = Math.random() * 0.18;
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(x, y, 2, 2);
    }
    for(let i=0;i<1200;i++){
        const x = Math.random() * size;
        const y = Math.random() * size;
        const alpha = Math.random() * 0.12;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(x, y, 3, 3);
    }
    ctx.fillStyle = grimeColor;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, size, size);
    ctx.globalAlpha = 1;
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

function createTiledTexture(baseColor, groutColor, tileSize){
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = groutColor;
    ctx.lineWidth = 2;
    for(let x=0;x<=size;x+=tileSize){
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();
    }
    for(let y=0;y<=size;y+=tileSize){
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
    }
    for(let i=0;i<3500;i++){
        const x = Math.random() * size;
        const y = Math.random() * size;
        const alpha = Math.random() * 0.2;
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(x, y, 2, 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

function createDealerFaceTexture(mood){
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#1a0f0f';
    ctx.beginPath();
    ctx.ellipse(128, 120, 80, 90, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a0505';
    ctx.beginPath();
    ctx.ellipse(90, 90, 16, 26, 0, 0, Math.PI * 2);
    ctx.ellipse(166, 90, 16, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d2b89a';
    ctx.beginPath();
    ctx.ellipse(128, 125, 18, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#d2b89a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    if(mood === 'grin'){
        ctx.beginPath();
        ctx.arc(128, 160, 36, 0.1, Math.PI - 0.1);
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(128, 160, 24, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }else if(mood === 'angry'){
        ctx.beginPath();
        ctx.arc(128, 175, 26, Math.PI + 0.2, Math.PI * 2 - 0.2);
        ctx.stroke();
        ctx.strokeStyle = '#5a2b2b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(78, 60);
        ctx.lineTo(108, 72);
        ctx.moveTo(178, 60);
        ctx.lineTo(148, 72);
        ctx.stroke();
    }else{
        ctx.beginPath();
        ctx.moveTo(98, 165);
        ctx.lineTo(158, 165);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

initBuckshotScene();
