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
        this.dealerSkip = false; // whether dealer loses next turn
        this.playerSkip = false; // whether player loses next turn
        this.seed = Date.now();
        this.animationSpeed = 1;
        this.dealerDelay = 0.5; // delay before dealer acts in seconds
        this.showIndicator = true; // display shell counter
        this.keepMagnify = false; // debug: keep magnifying glass after use
        this.keepCigarette = false; // debug: keep cigarette pack after use
        this.playerKnown = {}; // indices of shells revealed to the player
        this.dealerKnown = {}; // indices of shells revealed to the dealer
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
        this.dealerSkip = false;
        this.playerSkip = false;
        this.playerKnown = {};
        this.dealerKnown = {};
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
        this.updateItemPool();
        this.player.items = this.player.items.concat(this.randomItems()).slice(0,8);
        this.dealer.items = this.dealer.items.concat(this.randomItems()).slice(0,8);
        const magazineSize = 2 + Math.floor(this.random()*7); // 2-8
        this.magazine = this.generateLoad(magazineSize);
        this.current = 0;
        this.knownShell = null;
        this.dealerSkip = false;
        this.playerSkip = false;
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
        if(shell.type==='live') {
            target.hp -= shooter.damageBoost;
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
        if(this.dealerSkip) {
            setStatus('Dealer is restrained and loses a turn.');
            this.dealerSkip = false;
            await this.sleep(this.dealerDelay*1000);
            return;
        }
        // restrain player if possible
        const cuffsIndex = this.dealer.items.indexOf('Handcuffs');
        if(cuffsIndex > -1) {
            this.playerSkip = true;
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
                this.knownShell = null;
                this.updateUI();
                setStatus('Dealer discards a shell.');
                await this.sleep(this.dealerDelay*1000);
                return;
            } else {
                this.knownShell = null;
                this.shoot(this.dealer, this.dealer);
                await this.sleep(this.dealerDelay*1000);
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
    if(game.playerSkip){
        setStatus('You are restrained and lose a turn.');
        game.playerSkip=false;
        setTimeout(()=>game.dealerTurn(),game.dealerDelay*1000);
        return;
    }
    const result = game.shoot(game.player, game.player);
    if(result !== 'blank' &&
       game.player.hp>0 && game.dealer.hp>0 &&
       game.current < game.magazine.length) {
        setTimeout(()=>game.dealerTurn(),game.dealerDelay*1000);
    }
});
shootDealer.addEventListener('click',()=>{
    if(game.playerSkip){
        setStatus('You are restrained and lose a turn.');
        game.playerSkip=false;
        setTimeout(()=>game.dealerTurn(),game.dealerDelay*1000);
        return;
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

        if(interactive){
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
                        game.current++; game.player.items.splice(i,1); game.updateUI();
                        setStatus('You discarded a shell.');
                    }
                });
            }
            if(it==='Handcuffs') {
                div.addEventListener('click',()=>{
                    if(game.player.items[i]!=='Handcuffs') return;
                    game.dealerSkip = true;
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
                        const s=game.magazine[game.current];
                        s.type = s.type==='live'?'blank':'live';
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
        const remaining=this.magazine.slice(this.current);
        const lives=remaining.filter(s=>s.type==='live').length;
        const blanks=remaining.filter(s=>s.type==='blank').length;
        indicator.textContent=`Live: ${lives} Blank: ${blanks}`;
        indicator.style.display=this.showIndicator?'block':'none';
    }
    const pcuffs=document.getElementById('playerCuffs');
    const dcuffs=document.getElementById('dealerCuffs');
    if(pcuffs) pcuffs.style.display=this.playerSkip?'inline':'none';
    if(dcuffs) dcuffs.style.display=this.dealerSkip?'inline':'none';
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
            if(isPlayer) game.dealerSkip = true; else game.playerSkip = true;
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
                setStatus((isPlayer?'You':'Dealer')+' discarded a shell.');
            }
            break;
        case 'Hand Saw':
            user.damageBoost = 2;
            setStatus((isPlayer?'Your':'Dealer\'s')+' next shot will deal double damage.');
            break;
        case 'Inverter':
            if(game.current < game.magazine.length){
                const s = game.magazine[game.current];
                s.type = s.type==='live'?'blank':'live';
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
