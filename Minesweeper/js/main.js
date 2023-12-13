const CELLSIZE = 20;
const NEIGHBOURS = [[1, 0], [1, 1], [0, 1], [-1, 1], [1, -1], [-1, 0], [0, -1], [-1, -1]];

class Minesweeper{
	parentEl = null;
	id = "";

	game = [];
	unlocked = [];
	flags = [];

	startTime = null;
	timerInterval = null;
	width = 0;
	height = 0;
	mines = 0;
	difficulty = 0; // 0 beginner | 1 intermediate | 2 expert
	isFirstClick = true;
	isGameOver = false;
	lastCellSelected = null;

	constructor(id){
		const parent = document.importNode(document.getElementById("minesweeper-template").content.querySelector("div"), true);

		parent.querySelector("#game-body").addEventListener("mouseup", this.onGameMouseUp.bind(this));
		parent.querySelector("#game-body").addEventListener("mousemove", this.onGameMouseMove.bind(this));
		parent.querySelector("#difficulty").addEventListener("change", this.onDifficultyChange.bind(this));
	
		// interaction with the smiley button
		parent.querySelector("#smiley").addEventListener("mousedown", this.onSmileyMouseDown);
		parent.querySelector("#smiley").addEventListener("mouseup", this.onSmileyMouseUp.bind(this));
		parent.querySelector("#smiley").addEventListener("mouseleave", this.onSmileyMouseLeave);
	
		parent.querySelector("#custom-width").addEventListener("input", this.onCusomChange.bind(this));
		parent.querySelector("#custom-height").addEventListener("input", this.onCusomChange.bind(this));
		parent.querySelector("#custom-mines").addEventListener("input", this.onCusomChange.bind(this));
	
		parent.querySelector("#header-game").addEventListener("mouseover", this.openGameContextMenu);

		document.getElementById(id).appendChild(parent);

		this.parentEl = parent;
		this.id = id;
		this.reload();
	}

	onCusomChange(){
		this.checkCustomMineCount();
		this.checkCustomHeight();
		this.checkCustomWidth();
		this.reload();
	}
	onGameMouseUp(ev){
		if(this.isGameOver){
			return;
		}
		if(this.isFirstClick){
			this.startTimer();
		}
	
		this.setSmiley("🙂");
	
		const point = this.getPointFromEvent(ev);
	
		this.check(ev.button, point.x, point.y);
	
		if(this.checkFinished()){
			this.completed();
		}
	}
	onGameMouseMove(ev){
		if(ev.buttons != 1){
			return;
		}
		if(this.isGameOver){
			return;
		}
	
		const point = this.getPointFromEvent(ev);
		let cell = this.getCell(point.x, point.y);
	
		if(this.lastCellSelected != null){
			this.lastCellSelected.classList.remove("button-pressed");
			this.setSmiley("🙂");
		}
	
		if(cell == null){
			return;
		}
		if(this.unlocked[point.y][point.x]){
			return;
		}
		if(this.flagExist(point.x, point.y)){
			return;
		}
		
		this.setSmiley("😮");
		cell.classList.add("button-pressed");
		this.lastCellSelected = cell;
	}
	onDifficultyChange(ev){
		this.difficulty = parseInt(ev.currentTarget.value);
	
		this.toggleSelectDisplay(this.difficulty == 3);
	
		this.reload();
	}
	onSmileyMouseDown(ev){
		if(ev.button != 0){
			return;
		}
		ev.currentTarget.classList.add("button-pressed");
	}
	onSmileyMouseLeave(ev){
		ev.currentTarget.classList.remove("button-pressed");
	}
	onSmileyMouseUp(ev){
		if(ev.button != 0){
			return;
		}
		this.onSmileyMouseLeave(ev);
		this.reload();
	}
	checkFinished(){
		for (let i = 0; i < this.unlocked.length; i++) {
			for (let i2 = 0; i2 < this.unlocked[i].length; i2++) {
				if(this.game[i][i2] == 9){
					continue;
				}
				if(!this.unlocked[i][i2]){
					return false;
				}
			}
		}
	
		return true;
	}
	check(button, x, y){
		if(this.getValue(x, y) == 99){
			return;
		}
	
		if(button == 0){ // left button
			if(this.unlocked[y][x]){
				return;
			}
			if(this.flagExist(x, y)){
				return;
			}
	
			// first click cannot be a mine
			if(this.isFirstClick && this.game[y][x] == 9){
				this.createGame(this.mines, this.width, this.height);
				this.check(button, x, y);
			}
	
			this.createIcon(x, y);
		
			if(this.game[y][x] == 0){
				this.cascade(x, y);
			}
			else if(this.game[y][x] == 9){
				this.gameOver();
			}
	
			this.isFirstClick = false;
		}
		else if(button == 2){ // right button
			this.placeFlag(x, y);
		}
	}
	placeFlag(x, y){
		if(!this.flagExist(x,y)){
			if(this.unlocked[y][x]){
				return;
			}
	
			this.createIcon(x, y, 11);
			this.flags.push({x: x, y: y});
		}else{
			this.removeFlag(x, y);
	
			this.removeOverlay(x, y);
			this.parentEl.querySelector("#game-body").appendChild(this.createCell(x, y))
			this.unlocked[y][x] = false;
		}
	
		this.setDisplay(true, this.mines - this.flags.length);
	}
	flagExist(x, y){
		let r = false;
	
		for (let i = 0; i < this.flags.length; i++) {
			if(this.flags[i].x == x && this.flags[i].y == y){
				r = true
			}
		}
	
		return r;
	}
	removeFlag(x, y){
		for (let i = 0; i < this.flags.length; i++) {
			if(this.flags[i].x == x && this.flags[i].y == y){
				this.flags.splice(i, 1)
			}
		}
	}
	getPointFromEvent(event){
		let x = Math.floor((event.pageX - event.currentTarget.offsetLeft) / CELLSIZE);
		let y = Math.floor((event.pageY - event.currentTarget.offsetTop) / CELLSIZE);
	
		x = (x < 0) ? 0 : x;
		y = (y < 0) ? 0 : y;
	
		return {x: x, y: y}
	}
	removeOverlay(x, y){
		this.getCell(x, y).remove();
	}
	cascade(x, y){
		for (let i = 0; i < NEIGHBOURS.length; i++) {
			const newX = x + NEIGHBOURS[i][0];
			const newY = y + NEIGHBOURS[i][1];
	
			if(this.getValue(newX, newY) == 99){
				continue;
			}
			if(this.unlocked[newY][newX]){
				continue;
			}
	
			if(this.getValue(newX, newY) == 0){
				this.createIcon(newX, newY);
				this.cascade(newX, newY);
			}else{
				this.createIcon(newX, newY);
			}
		}
	}
	drawCells(width, height){
		let body = this.parentEl.querySelector("#game-body");
	
		for (let h = 0; h < height; h++) {
			for (let w = 0; w < width; w++) {
				body.appendChild(this.createCell(w, h))
			}
		}
	
		// change the background grid size
		body.style.backgroundSize = `${CELLSIZE + 0.08}px ${CELLSIZE+ 0.05}px`;
	}
	createCell(x, y){
		let el = document.createElement("div");
	
		el.style.height = `${CELLSIZE}px`;
		el.style.width = `${CELLSIZE}px`;
		el.style.left = `${x * CELLSIZE}px`;
		el.style.top = `${y * CELLSIZE}px`;
		el.setAttribute("class", "cell");
		el.setAttribute("id", `${this.id}${x}${y}`);
		el.innerHTML = "";
	
		return el;
	}
	// < 9 number | 9 exploded mine | 10 mine | 11 flag
	createIcon(x, y, value = this.game[y][x]){
		this.getCell(x, y).remove();
	
		if(value != 11){
			this.unlocked[y][x] = true;
		}
	
		// if a flag already exists on this location, remove it
		if(this.flagExist(x, y)){
			this.removeFlag(x, y);
		}
		if(value == 0){
			return;
		}
	
		let overlay = document.createElement("div");
		let span = document.createElement("span");
	
		if(value < 9 && value != 0){
			span.innerText = value;
			span.style.color = this.getColorFromValue(value);
		}
		else if(value == 9){
			overlay.innerText = "💣";
			overlay.style.backgroundColor = "red";
			overlay.style.fontSize = "0.75em";
		}
		else if(value == 10){
			overlay.innerText = "💣";
			overlay.style.fontSize = "0.75em";
		}
		else if(value == 11){
			overlay.innerText = "🚩";
			overlay.style.fontSize = "0.75em";
		}
	
		overlay.style.height = `${CELLSIZE}px`;
		overlay.style.width = `${CELLSIZE}px`;
		overlay.style.left = `${x * CELLSIZE}px`;
		overlay.style.top = `${y * CELLSIZE}px`;
		overlay.setAttribute("class", "overlay");
		overlay.setAttribute("id", `${this.id}${x}${y}`);
	
		span.setAttribute("class", "overlay-span");
		overlay.appendChild(span);
	
		this.parentEl.querySelector("#game-body").appendChild(overlay);
	}
	setBoardSize(width, height){
		let el = this.parentEl.querySelector("#game-body");
		el.style.width = `${width * CELLSIZE}px`;
		el.style.height = `${height  * CELLSIZE}px`;
	}
	createGame(mines, width, height){
		let minesPlaced = 0;
		this.game = [];
		this.unlocked = [];
	
		//create empty grid
		for (let h = 0; h < height; h++) {
			this.game.push([]);
			this.unlocked.push([]);
			for (let w = 0; w < width; w++) {
				this.game[h].push(0);
				this.unlocked[h].push(false);
			}
		}
		// place mines
		while (minesPlaced != mines) {
			let r = this.randomXY(width, height);
	
			if(!this.isMine(r.x, r.y)){
				this.game[r.y][r.x] = 9;
				minesPlaced++;
			}
		}
		// calculate values
		for (let h = 0; h < height; h++) {
			for (let w = 0; w < width; w++) {
				if(!this.isMine(w, h)){
					this.game[h][w] = this.mineCount(w, h);
				}
			}
		}
	}
	startTimer(){
		this.endTimer();
		this.startTime = new Date();

		const self = this;

		this.timerInterval = setInterval(function() {
			let endTime = new Date();
			let timeDiff = endTime - self.startTime;
			let seconds = Math.round(timeDiff / 1000);
	
			self.setDisplay(false, seconds);
		}, 500); // every half a second to prevent skipping a second
	}
	endTimer(){
		clearInterval(this.timerInterval);
	}
	setDisplay(isLeft, value){
		if(value > 999){
			value = 999;
		}
	
		let str = value.toString();
		let finalStr = (str.length >= 3) ? str : (new Array(3).join('0') + str).slice(-3);
		
		if(isLeft){
			this.parentEl.querySelector("#counter-left-val").innerText = finalStr;
		}else{
			this.parentEl.querySelector("#counter-right-val").innerText = finalStr;
		}
	}
	reload(){
		let settings = this.difficultyToSettings(this.difficulty);
	
		this.mines = settings.mines;
		this.width = settings.width;
		this.height = settings.height;
		this.isFirstClick = true;
		this.isGameOver = false;
		this.flags = [];
		
		this.setSmiley("🙂");
		this.endTimer();
		this.clearOverlay();
		this.createGame(this.mines, this.width, this.height);
		this.setBoardSize(this.width, this.height);
		this.drawCells(this.width, this.height);
		this.setDisplay(true, this.mines);
		this.setDisplay(false, "000");
	}
	clearOverlay(){
		let body = this.parentEl.querySelector("#game-body");
		
		while(body.children.length != 0){
			body.children[0].remove();
		}
	}
	mineCount(x, y){
		let mines = 0;
		
		for (let i = 0; i < NEIGHBOURS.length; i++) {
			if(this.isMine(x + NEIGHBOURS[i][0], y + NEIGHBOURS[i][1])){
				mines++;
			}
		}
		return mines;
	}
	getCell(x, y){
		return this.parentEl.querySelector(`#${this.id}${x}${y}`);
	}
	isMine(x, y){
		return this.getValue(x, y) == 9;
	}
	getValue(x, y){
		if(x < 0 || y < 0){
			return 99;
		}	
		if(x >= this.width || y >= this.height){
			return 99;
		}
		return this.game[y][x];
	}
	revealMines(){
		for (let h = 0; h < this.height; h++) {
			for (let w = 0; w < this.width; w++) {
				const hasFlag = this.flagExist(w, h);
	
				// if a flag was wrongly placed, show it
				if(hasFlag && this.game[h][w] != 9){
					this.getCell(w, h).style.backgroundColor = "red";
				}
	
				if(this.unlocked[h][w]){
					continue;
				}
				if(this.game[h][w] != 9){
					continue;
				}
				// dont show the mine where the player has placed a flag
				if(hasFlag){
					continue;
				}
	
				this.createIcon(w, h, 10);
			}
		}
	}
	checkCustomMineCount(){
		let el = this.parentEl.querySelector("#custom-mines");
		let mineCount = parseInt(el.value);
		const maxAllowed = Math.floor((this.getCustomWidth() * this.getCustomHeight()) * 0.98);
	
		// mines can only cover 98% of the game
		if(isNaN(mineCount)){
			mineCount = 1;
		}
		if(mineCount > maxAllowed){
			mineCount = maxAllowed;
		}
	
		el.value = mineCount;
	}
	checkCustomHeight(){
		let el = this.parentEl.querySelector("#custom-width");
		let height = parseInt(el.value);;

		if(isNaN(height)){
			height = 1;
		}

		el.value = height;
	}
	checkCustomWidth(){
		let el = this.parentEl.querySelector("#custom-width");
		let width = parseInt(el.value);;

		if(isNaN(width)){
			width = 1;
		}

		el.value = width;
	}
	gameOver(){
		this.isGameOver = true;
		this.setSmiley("😵");
		this.endTimer();
		this.revealMines();
	}
	completed(){
		this.isGameOver = true;
		this.setSmiley("😎");
		this.endTimer();
	}
	setSmiley(icon){
		this.parentEl.querySelector("#smiley").innerText = icon;
	}
	randomXY(maxX, maxY){
		const x = Math.floor(Math.random() * maxX);
		const y = Math.floor(Math.random() * maxY);
		return {x: x, y: y};
	}
	difficultyToSettings(d){
		switch(d){
			case 0:
				return {width: 9, height: 9, mines: 10};
			case 1:
				return {width: 16, height: 16, mines: 40};
			case 2:
				return {width: 30, height: 16, mines: 99};
			case 3:
				return {
					width: this.getCustomWidth(),
					height: this.getCustomHeight(),
					mines: this.getCustomMines()
				};
		}
	}
	getColorFromValue(value){
		switch(value){
			case 1: return "blue";
			case 2: return "green";
			case 3: return "red";
			case 4: return "navy";
			case 5: return "maroon";
			case 6: return "darkcyan";
			case 7: return "black";
			case 8: return "darkgray";
			default: return "white"; // should never be used
		}
	}
	getCustomWidth(){
		let w = parseInt(this.parentEl.querySelector("#custom-width").value);
		return (w == NaN) ? 1 : w;
	}
	getCustomHeight(){
		let h = parseInt(this.parentEl.querySelector("#custom-height").value);
		return (h == NaN) ? 1 : h;
	}
	getCustomMines(){
		let m = parseInt(this.parentEl.querySelector("#custom-mines").value);
		return (m == NaN) ? 1 : m;
	}
	toggleSelectDisplay(state){
		this.parentEl.querySelector("#custom-select").style.display = (state) ? "flex" : "none";
	}
	openGameContextMenu(){
		document.getElementById("header-game-option").classList.remove("hidden");
		document.addEventListener("mousemove", closeGameContextMenu)

		function closeGameContextMenu(event){
			const target = event.target;
			const parent = target.parentElement;

			if(["header-game", "header-game-option"].includes(target.id)){
				return
			}
			if(target.classList.contains("options-header")){
				return;
			}
			if(parent != null && (parent.id == "custom-select" || parent.id == "header-game-option")){
				return;
			}

			document.getElementById("header-game-option").classList.add("hidden");
			document.removeEventListener("mousemove", closeGameContextMenu)
		}
		
	}
}