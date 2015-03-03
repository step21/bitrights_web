// Thanks to Xenoveritas
// Original here: http://www.xenoveritas.org/node/501
// Modified to use jqconsole

function logging(jqconsole) {
	jqparse = (function(self) {
		return function(input) {
			try {
				if (self._callback) {
					var m = input;
					var cb = self._callback;
					self._callback = null;
					try {
						cb(m);
					} catch (ex) {
						self.println("An exception occurred while processing your input:");
						self.println(ex.toString());
						self.println("* * * THE PROGRAM IS DEAD * * *");
						self.println("You'll have to reload and try again.");
						self._input.disabled = true;
						self._callback = null;
						self._input.scrollIntoView();
						return false;
					}
					if (!self._callback) {
						if (!self._stopped) {
							self.println("No callback set - no more user input can be accepted.");
							//self._input.disabled = true;
							self.println("* * * THE PROGRAM IS DEAD * * *");
							self.println("You'll have to reload and try again.");
						}
					}
				} else {
					self.println("Whoops, no callback was set, so your command cannot be processed.");
					//self._input.disabled = true;
					self.println("* * * THE PROGRAM IS DEAD * * *");
					self.println("You'll have to reload and try again.");
				}
				//self._input.scrollIntoView();
			} catch (ex) {
				alert("Interal exception handling user input: " + ex);
			}
			return '';
		};
	})(this);
	this._commandCallback = (function(self) {
		return function(m) {
			self._command(m);
		};
	})(this);
};

logging.prototype = {
	println: function(varargs) {
		var m = [];
		for (var i = 0; i < arguments.length; i++) {m.push(arguments[i]);};
		if (m.length) jqconsole.Write(m.join('')+'\n', 'jqconsole-output', false);
	},
	_stopped: false,
	blklin: true,
	maxtrs: 79,
	toting: function(obj) {
		return this.place[obj-1] == -1;
	},
	here: function(obj) {
		return this.place[obj-1] == this.loc || this.toting(obj);
	},
	at: function(obj) {
		return this.place[obj-1] == this.loc || this.fixed[obj-1] == this.loc;
	},
	liq2: function(pbotl) {
		return pbotl == 0 ? this.water :
				(pbotl == 2 ? this.oil : 0);
	},
	liq: function() {
		return this.liq2(Math.max(this.prop(this.bottle),-1-this.prop(this.bottle)));
	},
	liqloc: function(loc) {
		var cond = logging.cond(loc);
		if ((cond & 0x04) != 0) {
			return ((cond & 0x02) == 0) ? this.water : this.oil;
		} else {
			return 0;
		}
	},
	bitset: function(l, n) {
		return (logging.cond(l) & (1 << n)) != 0;
	},
	forced: function(loc) {
		return logging.cond(loc) == 2;
	},
	dark: function() {
		return (logging.cond(this.loc) & 1) == 0 && (this.prop(this.lamp) == 0 ||
			(!this.here(this.lamp)));
	},
	pct: function(n) {
		return this.ran(100) < n;
	},
	prop: function(obj) {
		if (obj < 1 || obj > 100)
			throw Error("Bad object index " + obj);
		var p = this._itemProps[obj-1];
		return p == null ? 0 : p;
	},
	setProp: function(obj, value) {
		if (obj < 1 || obj > 100)
			throw Error("Bad object index " + obj);
		return this._itemProps[obj-1] = value;
	},

	setup: function() {
		this.abb = new Array(150);
		for (var i = 0; i < this.abb.length; i++) {
			this.abb[i] = 0;
		}
		this.atloc = new Array(150);
		for (var i = 0; i < this.atloc.length; i++) {
			this.atloc[i] = 0;
		}
		this.place = new Array(100);
		this.fixed = new Array(100);
		this.link = new Array(200);
		this._itemProps = [];
		this.hintlc = new Array(logging.HINTS.length);
		this.hinted = new Array(logging.HINTS.length);
		this.tk = new Array(20);
		this.dseen = new Array(6);
		this.dloc = new Array(6);
		this.odloc = new Array(6);
		for (var i = 0; i < 100; i++) {
			this.place[i] = 0;
			this.link[i] = 0;
			this.link[i+100] = 0;
		};
		for (var i = logging.FIXED.length-1; i >= 0; i--) {
			if (logging.FIXED[i] > 0) {
				this.drop(i+101, logging.FIXED[i]);
				this.drop(i+1, logging.PLACE[i]);
			}
		};

		for (var i = 100; i > 0; i--) {
			this.fixed[i-1] = logging.fixd(i);
			if (logging.plac(i) != 0 && logging.fixd(i) <= 0) {
				this.drop(i, logging.plac(i));
			}
		}

		this.tally = 0;
		this.tally2 = 0;

		for (var i = 50; i <= this.maxtrs; i++) {
			if (logging.PTEXT[i-1] != null) {
				this.setProp(i, -1);
				this.tally++;
			}
		};
		for (var i = 0; i < this.hinted.length; i++) {
			this.hinted[i] = false;
			this.hintlc[i] = 0;
		};

		// DEFINE SOME HANDY MNEMONICS.  THESE CORRESPOND TO OBJECT NUMBERS.

		// These are done in this way to allow the names to be minified when sent
		// through the closure compiler. Otherwise I'd just do it as an array.

		this.keys = this.vocab("KEYS", 1);
		this.lamp = this.vocab("LAMP", 1);
		this.grate = this.vocab("GRATE", 1);
		this.cage = this.vocab("CAGE", 1);
		this.rod = this.vocab("ROD", 1);
		this.rod2 = this.rod+1;
		this.steps = this.vocab("STEPS", 1);
		this.bird = this.vocab("BIRD", 1);
		this.door = this.vocab("DOOR", 1);
		this.pillow = this.vocab("PILLO", 1);
		this.snake = this.vocab("SNAKE", 1);
		this.fissur = this.vocab("FISSU", 1);
		this.tablet = this.vocab("TABLE", 1);
		this.clam = this.vocab("CLAM", 1);
		this.oyster = this.vocab("OYSTE", 1);
		this.magzin = this.vocab("MAGAZ", 1);
		this.dwarf = this.vocab("DWARF", 1);
		this.knife = this.vocab("KNIFE", 1);
		this.food = this.vocab("FOOD", 1);
		this.bottle = this.vocab("BOTTL", 1);
		this.water = this.vocab("WATER", 1);
		this.oil = this.vocab("OIL", 1);
		this.plant = this.vocab("PLANT", 1);
		this.plant2 = this.plant+1;
		this.axe = this.vocab("AXE", 1);
		this.mirror = this.vocab("MIRRO", 1);
		this.dragon = this.vocab("DRAGO", 1);
		this.chasm = this.vocab("CHASM", 1);
		this.troll = this.vocab("TROLL", 1);
		this.troll2 = this.troll+1;
		this.bear = this.vocab("BEAR", 1);
		this.messag = this.vocab("MESSA", 1);
		this.vend = this.vocab("VENDI", 1);
		// Batter is actually battery
		this.batter = this.vocab("BATTE", 1);

		/* OBJECTS FROM 50 THROUGH WHATEVER ARE TREASURES.  HERE ARE A FEW. */

		this.nugget = this.vocab("GOLD", 1);
		this.coins = this.vocab("COINS", 1);
		this.chest = this.vocab("CHEST", 1);
		this.eggs = this.vocab("EGGS", 1);
		this.tridnt = this.vocab("TRIDE", 1);
		this.vase = this.vocab("VASE", 1);
		this.emrald = this.vocab("EMERA", 1);
		this.pyram = this.vocab("PYRAM", 1);
		this.pearl = this.vocab("PEARL", 1);
		this.rug = this.vocab("RUG", 1);
		this.chain = this.vocab("CHAIN", 1);

		/* THESE ARE MOTION-VERB NUMBERS. */
		this.back = this.vocab("BACK", 0);
		this.look = this.vocab("LOOK", 0);
		this.cave = this.vocab("CAVE", 0);
		this.wdNull = this.vocab("NULL", 0);
		this.entrnc = this.vocab("ENTRA", 0);
		this.dprssn = this.vocab("DEPRE", 0);

		/* AND SOME ACTION VERBS. */

		this.say = this.vocab("SAY", 2);
		this.lock = this.vocab("LOCK", 2);
		this.wdThrow = this.vocab("THROW", 2);
		this.find = this.vocab("FIND", 2);
		this.invent = this.vocab("INVEN", 2);
		this.chloc = 114;
		this.chloc2 = 140;
		this.dseen = [ false, false, false, false, false, false ];
		this.dflag = 0;
		this.dloc = [ 19, 27, 33, 44, 64, this.chloc ];
		this.odloc = [0,0,0,0,0,0];
		this.daltlc = 18;
		/*
		 * OTHER RANDOM FLAGS AND COUNTERS, AS FOLLOWS:
		 *	TURNS	TALLIES HOW MANY COMMANDS HE'S GIVEN (IGNORES YES/NO)
		 *	LIMIT	LIFETIME OF LAMP (NOT SET HERE)
		 *	IWEST	HOW MANY TIMES HE'S SAID "WEST" INSTEAD OF "W"
		 *	KNFLOC	0 IF NO KNIFE HERE, LOC IF KNIFE HERE, -1 AFTER CAVEAT
		 *	DETAIL	HOW OFTEN WE'VE SAID "NOT ALLOWED TO GIVE MORE DETAIL"
		 *	ABBNUM	HOW OFTEN WE SHOULD PRINT NON-ABBREVIATED DESCRIPTIONS
		 *	MAXDIE	NUMBER OF REINCARNATION MESSAGES AVAILABLE (UP TO 5)
		 *	NUMDIE	NUMBER OF TIMES KILLED SO FAR
		 *	HOLDNG	NUMBER OF OBJECTS BEING CARRIED
		 *	DKILL	NUMBER OF DWARVES KILLED (UNUSED IN SCORING, NEEDED FOR MSG)
		 *	FOOBAR	CURRENT PROGRESS IN SAYING "FEE FIE FOE FOO".
		 *	BONUS	USED TO DETERMINE AMOUNT OF BONUS IF HE REACHES CLOSING
		 *	CLOCK1	NUMBER OF TURNS FROM FINDING LAST TREASURE TILL CLOSING
		 *	CLOCK2	NUMBER OF TURNS FROM FIRST WARNING TILL BLINDING FLASH
		 *	LOGICALS WERE EXPLAINED EARLIER
		 *
		 *  WZDARK SAYS WHETHER THE LOC HE'S LEAVING WAS DARK
		 *  LMWARN SAYS WHETHER HE'S BEEN WARNED ABOUT LAMP GOING DIM
		 *  CLOSNG SAYS WHETHER ITS CLOSING TIME YET
		 *  PANIC SAYS WHETHER HE'S FOUND OUT HE'S TRAPPED IN THE CAVE
		 *  CLOSED SAYS WHETHER WE'RE ALL THE WAY CLOSED
		 *  GAVEUP SAYS WHETHER HE EXITED VIA "QUIT"
		 *  SCORNG INDICATES TO THE SCORE ROUTINE WHETHER WE'RE DOING A "SCORE" COMMAND
		 *  DEMO IS TRUE IF THIS IS A PRIME-TIME DEMONSTRATION GAME
		 *  YEA IS RANDOM YES/NO REPLY
		 */
		this.turns = 0;
		this.lmwarn = false;
		this.iwest = 0;
		this.knfloc = 0;
		this.detail = 0;
		this.abbnum = 5;
		for (var i = 0; i < 4; i++) {
			if (logging.RTEXT[2*i+81] != null)
				this.maxdie = i+1;
		}
		this.numdie = 0;
		this.holdng = 0;
		this.dkill = 0;
		this.foobar = 0;
		this.bonus = 0;
		this.clock1 = 30;
		this.clock2 = 50;
		this.closng = false;
		this.panic = false;
		this.closed = false;
		this.gaveup = false;
		this.wizard = false;
	},
	start: function() {
		this.ran(1);
		this.oldloc = 1;
		this.loc = 1;
		this.newloc = 1;
		this.limit = 330;
		this._undoTaunt = false;
		this._nextTurn();
		this.jqp();
	},
	jqp: function() {
		var parentthis = this;
		if (!this._stopped) {
			jqconsole.Prompt(true, function (input) {
        		if (input) jqconsole.Write(jqparse(input) + '\n', 'jqconsole-output',false);
        		parentthis.jqp();
	        	return true;
    	    });
    	};
	},
	_nextTurn: function() {
		// Label 2
		// CAN'T LEAVE CAVE ONCE IT'S CLOSING (EXCEPT BY MAIN OFFICE).
		if (this.newloc < 9 && this.newloc != 0 && this.closng) {
			this.rspeak(130);
			if (!this.panic) {
				this.clock2 = 15;
				this.panic = true;
			}
		}
		/*
		 * SEE IF A DWARF HAS SEEN HIM AND HAS COME FROM WHERE HE WANTS TO GO.
		 * IF SO, THE DWARF'S BLOCKING HIS WAY.  IF COMING FROM PLACE FORBIDDEN
		 * TO PIRATE (DWARVES ROOTED IN PLACE) LET HIM GET OUT (AND ATTACKED).
		 */
		if (this.newloc != this.loc && (!this.forced(this.loc)) && (!this.bitset(this.loc,3))) {
			for (var i = 0; i < 5; i++) {
				if (this.odloc[i] == this.newloc && this.dseen[i]) {
					this.newloc = this.loc;
					this.rspeak(2);
					break;
				}
			}
		}
		this.loc = this.newloc;

		/*
		 * DWARF STUFF.  SEE EARLIER COMMENTS FOR DESCRIPTION OF VARIABLES.  REMEMBER
		 * SIXTH DWARF IS PIRATE AND IS THUS VERY DIFFERENT EXCEPT FOR MOTION RULES.
		 *
		 * FIRST OFF, DON'T LET THE DWARVES FOLLOW HIM INTO A PIT OR A WALL.  ACTIVATE
		 * THE WHOLE MESS THE FIRST TIME HE GETS AS FAR AS THE HALL OF MISTS (LOC 15).
		 * IF NEWLOC IS FORBIDDEN TO PIRATE (IN PARTICULAR, IF IT'S BEYOND THE TROLL
		 * BRIDGE), BYPASS DWARF STUFF.  THAT WAY PIRATE CAN'T STEAL RETURN TOLL, AND
		 * DWARVES CAN'T MEET THE BEAR.  ALSO MEANS DWARVES WON'T FOLLOW HIM INTO DEAD
		 * END IN MAZE, BUT C'EST LA VIE.  THEY'LL WAIT FOR HIM OUTSIDE THE DEAD END.
		 */

		if (this.loc == 0 || this.forced(this.loc) || this.bitset(this.newloc,3)) {
			return this._describeLocation();
		}
		if (this.dflag == 0) {
			if (this.loc >= 15) {
				this.dflag = 1;
			}
			return this._describeLocation();
		}
		/*
		 * WHEN WE ENCOUNTER THE FIRST DWARF, WE KILL 0, 1, OR 2 OF THE 5 DWARVES.  IF
		 * ANY OF THE SURVIVORS IS AT LOC, REPLACE HIM WITH THE ALTERNATE.
		 */
		// Label 6000
		if (this.dflag == 1) {
			if (this.loc < 15 || this.pct(95)) {
				return this._describeLocation();
			}
			this.dflag = 2;
			for (var i = 0; i < 2; i++) {
				var j = this.ran(5);
				// The original did something about skipping the start call, but
				// that's not an issue here.
				if (this.pct(50))
					this.dloc[j] = 0;
			}
			for (var i = 0; i < 5; i++) {
				if (this.dloc[i] == this.loc) {
					this.dloc[i] = this.daltlc;
				}
				this.odloc[i] = this.dloc[i];
			}
			this.rspeak(3);
			this.drop(this.axe, this.loc);
			return this._describeLocation();
		}
		/*
		 * THINGS ARE IN FULL SWING.  MOVE EACH DWARF AT RANDOM, EXCEPT IF HE'S SEEN US
		 * HE STICKS WITH US.  DWARVES NEVER GO TO LOCS <15.  IF WANDERING AT RANDOM,
		 * THEY DON'T BACK UP UNLESS THERE'S NO ALTERNATIVE.  IF THEY DON'T HAVE TO
		 * MOVE, THEY ATTACK.  AND, OF COURSE, DEAD DWARVES DON'T DO MUCH OF ANYTHING.
		 */
		// Label 6010
		var dtotal = 0;
		var attack = 0;
		var stick = 0;
		var j;
		dwarfloop: for (var i = 0; i < 6; i++) {
			if (this.dloc[i] != 0) {
				// NOTE: J is an array index. Needless to say, it's -1 compared
				// to the original throughout.
				j = 0;
				var kk = logging.TRAVEL_KEY[this.dloc[i]-1];
				if (kk >= 0) {
					// Label 6012
					do {
						var newloc = (Math.floor(Math.abs(logging.TRAVEL[kk])/1000)) % 1000;
						if (newloc == 0) {
							this.println(" ---- UH OH ----");
							this.println("Newloc for dwarf #", i+1, " is 0.");
							this.println("Dwarf is currently in " + this.dloc[i] + ", kk=" + kk);
							this.println("NOT MOVING DWARF TO AVOID CRASH!");
						} else {
							// This is one hell of an awful if statement, but I think it's
							// correct from the original, assuming no weird Fortran order
							// of operations.
							if (newloc > 300 || newloc == 15 ||
									newloc == this.odloc[i] ||
									(j > 0 && newloc == this.tk[j-1]) || j > this.tk.length
									|| newloc == this.dloc[i] || this.forced(newloc) ||
									(i == 5 && this.bitset(newloc,3)) ||
									Math.floor(Math.abs(logging.TRAVEL[kk])/1000000) == 100) {
								// Not inverting the logic here
							} else {
								this.tk[j] = newloc;
								j++;
							}
						}
						// Label 6014
						kk++;
						// Note KK is a 0-based index, and this -1 is from the original.
					} while (logging.TRAVEL[kk-1] >= 0);
				}
				// Label 6016
				this.tk[j] = this.odloc[i];
				if (j >= 1)
					j--;
				// Note: original was J=1+RAN(J) - since our J is -1, we need
				// to increase the range, but don't need to add the 1 back to
				// the index.
				j = this.ran(j + 1);
				this.odloc[i] = this.dloc[i];
				this.dloc[i] = this.tk[j];
				this.dseen[i] = this.dseen[i] && this.loc >= 15 ||
						this.dloc[i] == this.loc || this.odloc[i] == this.loc;
				if (this.dseen[i]) {
					this.dloc[i] = this.loc;
					if (i == 5) {
						// THE PIRATE'S SPOTTED HIM.  HE LEAVES HIM ALONE ONCE WE'VE FOUND CHEST.
						// K COUNTS IF A TREASURE IS HERE.  IF NOT, AND TALLY=TALLY2 PLUS ONE FOR
						// AN UNSEEN CHEST, LET THE PIRATE BE SPOTTED.
						if (this.loc == this.chloc || this.prop(this.chest) >= 0) {
							continue dwarfloop;
						}
						k = 0;
						for (j = 50; j <= this.maxtrs; j++) {
							// PIRATE WON'T TAKE PYRAMID FROM PLOVER ROOM OR DARK ROOM (TOO EASY!).
							if (j == this.pyram && (this.loc == logging.plac(this.pyram)
									|| this.loc == logging.plac(this.emrald))) {
								// Rather than invert the logic, let's just do
								// nothing here.
							} else {
								this.idondx = j;
								if (this.toting[this.idondx]) {
									this.rspeak(128);
									// DON'T STEAL CHEST BACK FROM TROLL!
									if (this.place[this.messag-1] == 0) {
										this.move(this.chest, this.chloc);
									}
									this.move(this.messag, this.chloc2);
									for (j = 50; j <= this.maxtrs; j++) {
										if (j == this.pyram && (this.loc == logging.plac(this.pyram)
												|| this.loc == logging.plac(this.emrald))) {
											continue;
										}
										this.idondx = j;
										if (this.at(this.idondx) && this.fixed[this.idondx-1] == 0)
											this.carry(this.idondx, this.loc);
										if (this.toting(this.idondx)) {
											this.drop(this.idondx, this.chloc);
										}
									}
									// Label 6024
									this.dloc[5] = this.chloc;
									this.odloc[5] = this.chloc;
									this.dseen[5] = false;
									continue dwarfloop;
								}
							}
							// Label 6020
							if (this.here(this.idondx)) {
								k = 1;
							}
						}
						if (this.tally == (this.tally2+1) && k == 0 &&
								this.place[this.chest-1] == 0 && this.here(this.lamp) &&
								this.prop(this.lamp) == 1) {
							this.rspeak(186);
							this.move(this.chest, this.chloc);
							this.move(this.messag, this.chloc2);
							// Label 6024, copy-pasted
							this.dloc[5] = this.chloc;
							this.odloc[5] = this.chloc;
							this.dseen[5] = false;
							continue dwarfloop;
						}
						if (this.odloc[5] != this.dloc[5] && this.pct(20)) {
							this.rspeak(127);
						}
						continue dwarfloop;
					} else {
						// THIS THREATENING LITTLE DWARF IS IN THE ROOM WITH HIM!
						// Label 6027
						dtotal++;
						if (this.odloc[i] != this.dloc[i]) {
							continue;
						}
						attack++;
						if (this.knfloc >= 0) {
							this.knfloc = this.loc;
						}
						if (this.ran(1000) < (95*this.dflag-2))
							stick++;
					}
				}
			}
			// Label 6030
		}
		// NOW WE KNOW WHAT'S HAPPENING.  LET'S TELL THE POOR SUCKER ABOUT IT.

		if (dtotal > 0) {
			if (dtotal == 1) {
				this.rspeak(4);
			} else {
				this.println(" There are ", dtotal, " threatening little dwarves in the room with you.");
			}
			if (attack > 0) {
				if (this.dflag == 2)
					this.dflag = 3;
				if (attack == 1) {
					this.rspeak(5);
					k = 52;
				} else {
					this.println(" ", attack, " of them throw knives at you!");
					k = 6;
				}
				if (stick > 1) {
					this.println(" ", stick, " of them get you!");
				} else {
					this.rspeak(k+stick);
				}
				if (stick > 0) {
					this.oldlc2 = this.loc;
					return this._died();
				}
			}
		}
		this._describeLocation();
	},
	_describeLocation: function() {
		/*
		 * DESCRIBE THE CURRENT LOCATION AND (MAYBE) GET NEXT COMMAND.
		 *
		 * PRINT TEXT FOR CURRENT LOC.
		 */
		// Label 2000
		if (this.loc == 0) {
			// If location 0, you're dead.
			return this._died();
		}
		var msg = logging.SHORT_DESCRIPTIONS[this.loc-1];
		if ((this.abb[this.loc-1] % this.abbnum) == 0 || msg == null) {
			msg = logging.LONG_DESCRIPTIONS[this.loc-1];
		}
		if ((!this.forced(this.loc)) && this.dark()) {
			if (this.wzdark && this.pct(35)) {
				return this._fellIntoAPit();
			}
			// Change message to indicate that it's dark
			msg = logging.RTEXT[15];
		}
		// Label 2001
		if (this.toting(this.bear)) {
			this.rspeak(141);
		}
		this.speak(msg);
		k = 1;
		if (this.forced(this.loc)) {
			return this._motionVerb(k);
		}
		if (this.loc == 33 && this.pct(25) && (!this.closng)) {
			this.rspeak(8);
		}
		/*
		 * PRINT OUT DESCRIPTIONS OF OBJECTS AT THIS LOCATION.  IF NOT CLOSING AND
		 * PROPERTY VALUE IS NEGATIVE, TALLY OFF ANOTHER TREASURE.  RUG IS SPECIAL
		 * CASE; ONCE SEEN, ITS PROP IS 1 (DRAGON ON IT) TILL DRAGON IS KILLED.
		 * SIMILARLY FOR CHAIN; PROP IS INITIALLY 1 (LOCKED TO BEAR).  THESE HACKS
		 * ARE BECAUSE PROP=0 IS NEEDED TO GET FULL SCORE.
		 */
	
		if (!this.dark()) {
			this.abb[this.loc-1]++;
			// Label 2004
			// The continue statement is label 2008
			for (var i = this.atloc[this.loc-1]; i != 0; i = this.link[i-1]) {
				var obj = i;
				if (obj > 100)
					obj = obj-100;
				if (!(obj == this.steps && this.toting(this.nugget))) {
					if (this.prop(obj) < 0) {
						if (this.closed) {
							continue;
						}
						this.setProp(obj, 0);
						if (obj == this.rug || obj == this.chain) {
							this.setProp(obj, 1);
						}
						this.tally--;
						// IF REMAINING TREASURES TOO ELUSIVE, ZAP HIS LAMP.
						if (this.tally == this.tally2 && this.tally != 0) {
							this.limit = Math.min(35, this.limit);
						}
					}
					// Label 2006
					var kk = this.prop(obj);
					if (obj == this.steps && this.loc == this.fixed[this.steps-1])
						kk = 1;
					this.pspeak(obj, kk);
				}
			}
		}
		this._getCommand();
	},
	/**
	 * Called when a command succeeds, prints "OK" and continues. Line 2009 in
	 * the original.
	 */
	_commandSuccess: function() {
		return this._commandError(54);
	},
	/**
	 * Show an error. Basically, this takes an optional argument to tell it
	 * WHAT to say, then says it from rpseak, then executes getCommand.
	 * It corresponds to lines 2010 and 2011 in the original, as follows:
	 * 2010: call with "k" to say
	 * 2011: call with "this.spk"
	 */
	_commandError: function(k) {
		this.rspeak(k);
		return this._getCommand();
	},
	_getCommand: function() {
		// Label 2012
		this.verb = 0;
		this.obj = 0;
		return this._hint(0);
	},
	/**
	 * Entry point to the hint code. Since we need to be able to interrupt and
	 * resume the loop, takes the current hint. Call with 0 on first entrance.
	 * Yeah, I could just default it, but it's easier to make you call it with
	 * 0.
	 * @param {number} hint the hint to resume at - start with 0.
	 */
	_hint: function(hint) {
		/*
		 * CHECK IF THIS LOC IS ELIGIBLE FOR ANY HINTS.  IF BEEN HERE LONG ENOUGH,
		 * BRANCH TO HELP SECTION (ON LATER PAGE).  HINTS ALL COME BACK HERE EVENTUALLY
		 * TO FINISH THE LOOP.  IGNORE "HINTS" < 4 (SPECIAL STUFF, SEE DATABASE NOTES).
		 */
		// Port note: hint taken as the 0-based index for most of the loop here.
		// The one exception is when checking to see if this location applies to
		// the specific hint, in which case we have to increment it to restore
		// it to the original Fortran index.
		for (hint=Math.max(hint,3); hint < logging.HINTS.length; hint++) {
			if (!this.hinted[hint]) {
				if (!this.bitset(this.loc, hint+1)) {
					//this.println("Not a hint location for hint ", hint);
					this.hintlc[hint] = -1;
				}
				this.hintlc[hint]++;
				//this.println("Hint count for hint ", hint, " is now " + this.hintlc[hint]);
				if (this.hintlc[hint] >= logging.HINTS[hint][0]) {
					if (this._hintActive(hint)) {
						// Label 40010
						this.hintlc[hint] = 0;
						// HRRRRK...
						// This kinda SUCKS since we have to be able to resume
						// the loop... but closures to the rescue (sorta)
						return this.yes(logging.HINTS[hint][2], 0, 54, function(yea) {
							if (yea) {
								this.println(' I am prepared to give you a hint, but it will cost you ',
									logging.HINTS[hint][1], ' points.');
								return this.yes(175, logging.HINTS[hint][3], 54, function(yea) {
									this.hinted[hint] = yea;
									if (this.hinted[hint] && this.limit > 30) {
										this.limit += 30*(logging.HINTS[hint][1]);
										this.hintlc[hint] = 0;
									}
									return this._hint(hint);
								});
							} else {
								// This is the closure bit - hint should still
								// be in the environment, so we can just recall
								// the original function with it.
								return this._hint(hint);
							}
						});
					}
				}
			}
			// Label 2602 is CONTINUE
		}
		/*
		 * KICK THE RANDOM NUMBER GENERATOR JUST TO ADD VARIETY TO THE CHASE.  ALSO,
		 * IF CLOSING TIME, CHECK FOR ANY OBJECTS BEING TOTED WITH PROP < 0 AND SET
		 * THE PROP TO -1-PROP.  THIS WAY OBJECTS WON'T BE DESCRIBED UNTIL THEY'VE
		 * BEEN PICKED UP AND PUT DOWN SEPARATE FROM THEIR RESPECTIVE PILES.  DON'T
		 * TICK CLOCK1 UNLESS WELL INTO CAVE (AND NOT AT Y2).
		 */
		if (this.closed) {
			if (this.prop(this.oyster) < 0 && this.toting(this.oyster)) {
				this.pspeak(this.oyster, 1);
			}
			for (var i = 1; i <= 100; i++) {
				if (this.toting(i) && this.prop(i) < 0) {
					this.setProp(i, (-1)-this.prop(i));
				}
			}
		}
		// Label 2605
		this.wzdark = this.dark();
		if (this.knfloc > 0 && this.knfloc != this.loc) {
			this.knfloc = 0;
		}
		this.ran(1);
		this.getin(this._commandCallback);
	},
	_command: function(m) {
		// ADVENT wants two words. The magic of regex makes that easy:
		var match = /^(\S+)(?:\s+(\S+))?/.exec(m);
		if (match == null) {
			// In this case, a blank command, just re-exec
			this.getin(this._commandCallback);
			return;
		}
		var wd1 = match[1].toUpperCase();
		var wd2 = match[2];
		if (wd2 != null)
			wd2 = wd2.toUpperCase();
		// EVERY INPUT, CHECK "FOOBAR" FLAG.  IF ZERO, NOTHING'S GOING ON.  IF POS,
		// MAKE NEG.  IF NEG, HE SKIPPED A WORD, SO MAKE IT ZERO.
		// Label 2608
		this.foobar = Math.min(0, -this.foobar);
		if (this.turns == 0 && wd1 == 'MAGIC' && wd2 == 'MODE') {
			this.println("Fine, you're a wizard.");
			this.wizard = true;
			return this._getCommand();
		}
		this.turns++;
		// This is to test that the random number generator actually works.
		// It doesn't, really, but whatever.
		if (wd1 == 'ROLL' && (wd2 == 'DICE' || wd2 == 'DIE')) {
			this.println("You roll a " + this.ran(1000) + ".");
			return this._getCommand();
		}
		if (wd1 == 'SUICIDE') {
			if (this.wizard) {
				this.println("Well, if you say so.");
				return this._died();
			} else {
				this.println("Suicide is only the answer if you are an immortal wizard.");
			}
			return this._getCommand();
		}
		if (wd1 == 'UNDO') {
			if (this._undoTaunt && this.pct(25)) {
				if (navigator.userAgent.indexOf("Mac") > 0) {
					this.speak("Try using Command-Z.");
				} else {
					this.speak("Try using Control-Z.");
				}
			} else {
				this._undoTaunt = true;
				this.speak("What do you think this is, the Inform port?");
			}
			return this._getCommand();
		}
		if (wd1 == 'RESUME' || wd1 == 'RESTORE' || wd1 == 'LOAD' || wd1 == 'RELOAD') {
			this.speak("Restore by loading the URL you were given when you saved.");
			return this._getCommand();
		}
		if (this.wizard && wd1 == 'FIND' && wd2 == 'EVERYTHING') {
			// Magic command to find where everything is located (dump atloc)
			this.println("ATLOC table is:");
			for (var i = 0; i < this.atloc.length; i++) {
				this.println((i+1) + ": " + this.atloc[i]);
			}
			return this._getCommand();
		}
		// No such thing as demo mode in this port
		if (this.verb == this.say) {
			if (wd2 != null)
				this.verb = 0;
			return this._transitiveVerb(wd1, wd2);
		}
		if (this.tally == 0 && this.loc >= 15 && this.loc != 33) {
			this.clock1--;
		}
		if (this.clock1 == 0) {
			this._caveClosing();
		} else {
			if (this.clock1 < 0) {
				clock2--;
			}
			if (this.clock2 == 0) {
				return this._setupStorageRoom();
			}
			if (this.prop(this.lamp) == 1) {
				// There goes the battery...
				this.limit--;
			}
			/*
			 * ANOTHER WAY WE CAN FORCE AN END TO THINGS IS BY HAVING THE LAMP GIVE OUT.
			 * WHEN IT GETS CLOSE, WE COME HERE TO WARN HIM.  WE GO TO 12000 IF THE LAMP
			 * AND FRESH BATTERIES ARE HERE, IN WHICH CASE WE REPLACE THE BATTERIES AND
			 * CONTINUE.  12200 IS FOR OTHER CASES OF LAMP DYING.  12400 IS WHEN IT GOES
			 * OUT, AND 12600 IS IF HE'S WANDERED OUTSIDE AND THE LAMP IS USED UP, IN WHICH
			 * CASE WE FORCE HIM TO GIVE UP.
			 */
			if (this.limit <= 30) {
				if (this.here(this.batter) && this.prop(this.batter) == 0) {
					this.rspeak(188);
					this.setProp(this.batter, 1);
					if (this.toting(this.batter))
						this.drop(this.batter, this.loc);
					this.limit += 2500;
					this.lmwarn = false;
				} else if (this.limit == 0) {
					this.limit = -1;
					this.setProp(this.lamp, 0);
					if (this.here(this.lamp))
						this.rspeak(184);
				} else if (this.limit < 0 && this.loc <= 8) {
					this.rspeak(185);
					this.gaveup = true;
					return this._endGame();
				} else {
					if (!this.lmwarn && this.here(this.lamp)) {
						this.lmwarn = true;
						var spk = 187;
						if (this.place[this.batter-1] == 0)
							spk = 183;
						if (this.prop(this.batter) == 1)
							spk = 189;
						this.rspeak(189);
					}
				}
			}
		}
		// Label 19999
		var k = 43;
		if (this.liqloc(this.loc) == this.water) {
			k = 70;
		}
		if (wd1 == 'ENTER' && (wd2.substr(0,5) == 'STREA' || wd2 == 'WATER')) {
			return this._commandError(k);
		}
		if (wd1 == 'ENTER' && wd2 != null) {
			return this._parseWord(wd2, null);
		}
		if ((wd1 == 'WATER' || wd1 == 'OIL')
				&& (wd2 == 'PLANT' || wd2 == 'DOOR')) {
			// Change wd2 to "POUR" if we're in the right spot
			if (this.at(this.vocab(wd2,1)))
				wd2 = 'POUR';
		}
		// Label 2610
		if (wd1 == 'WEST') {
			this.iwest++;
			if (this.iwest == 10) {
				this.rspeak(17);
			}
		}
		// Label 2630
		return this._parseWord(wd1, wd2);
	},
	_parseWord: function(wd1, wd2) {
		var i = this.vocab(wd1, -1);
		if (i == -1) {
			this._dontUnderstand();
			return;
		}
		var k = i % 1000;
		var kq = Math.floor(i/1000);
		// DEBUG:
		//this.println("k=" + k + ";kq=" + kq);
		switch (kq) {
		case 0:
			this._motionVerb(k);
			return;
		case 1:
			return this._analyseObject(k, wd1, wd2);
		case 2:
			return this._verb(k, wd1, wd2);
		case 3:
			this.rspeak(k);
			return this._getCommand();
		default:
			this.bug(22);
		}
	},
	/**
	 * GEE, I DON'T UNDERSTAND.
	 */
	_dontUnderstand: function() {
		// Label 3000
		var spk=60;
		if (this.pct(20)) {
			spk=61;
		}
		if (this.pct(20)) {
			spk=13;
		}
		this.rspeak(spk);
		this._hint(0);
	},
	/**
	 * ANALYSE A VERB.  REMEMBER WHAT IT WAS, GO BACK FOR OBJECT IF SECOND WORD
	 * UNLESS VERB IS "SAY", WHICH SNARFS ARBITRARY SECOND WORD.
	 */
	_verb: function(k, wd1, wd2) {
		// Label 4000
		this.verb = k;
		this.spk = logging.ACTSPK[this.verb-1];
		if (wd2 != null && this.verb != this.say) {
			return this._parseWord(wd2, null);
		}
		if (this.verb == this.say) {
			// Basically, just check if wd2 is set for say
			this.obj = wd2 == null ? 0 : -1;
		}
		if (this.obj != 0) {
			return this._transitiveVerb(wd1, wd2);
		}
		return this._intransitiveVerb(wd1, wd2);
	},
	_intransitiveVerb: function(wd1, wd2) {
		// Label 4080
		switch (this.verb) {
		case 1: // TAKE
			return this._intransTake();
		case 2: // DROP
		case 3: // SAY
		case 9: // WAVE
		case 10: // CALM
		case 16: // RUB
		case 17: // TOSS
		case 19: // FIND
		case 21: // FEED
		case 28: // BREK
		case 29: // WAKE
			return this._toWhat();
		case 4: // OPEN
		case 6: // LOCK
			return this._intransLock();
		case 5: // NOTH
			return this._commandSuccess();
		case 7: // ON
			return this._lightLamp();
		case 8: // OFF
			return this._lampOff();
		case 11: // WALK
			return this._commandError(this.spk);
		case 12: // KILL
			return this._attack();
		case 13: // POUR
			return this._pour();
		case 14: // EAT
			return this._intransEat();
		case 15: // DRNK
			return this._drink();
		case 18: // QUIT
			return this._quit();
		case 20: // INVN
			return this._inventory();
		case 22: // FILL
			return this._fill();
		case 23: // BLST
			return this._blast();
		case 24: // SCOR
			return this._scoreVerb();
		case 25: // FOO
			return this._foo(wd1);
		case 26: // BRF
			return this._brief();
		case 27: // READ
			return this._readIntrans(wd1);
		case 30: // SUSP
			return this._suspend();
		case 31: // HOUR
			return this._hours();
		default:
			this.bug(23);
		}
	},
	/**
	 * ANALYSE A TRANSITIVE VERB.
	 */
	_transitiveVerb: function(wd1, wd2) {
		// Label 4090
		switch (this.verb) {
		case 1: // TAKE
			return this._take();
		case 2: // DROP
			return this._drop();
		case 3: // SAY
			return this._say(wd1, wd2);
		case 4: // OPEN
		case 6: // LOCK
			return this._lock();
		case 5: // NOTH
			return this._commandSuccess();
		case 7: // ON
			return this._lightLamp();
		case 8: // OFF
			return this._lampOff();
		case 9: // WAVE
			return this._wave();
		case 10: // CALM
		case 11: // WALK
		case 18: // QUIT
		case 24: // SCOR
		case 25: // FOO
		case 26: // BRF
		case 30: // SUSP
		case 31: // HOUR
			return this._commandError(this.spk);
		case 12: // KILL
			return this._attack();
		case 13: // POUR
			return this._pour();
		case 14: // EAT
			return this._eat();
		case 15: // DRNK
			return this._drink();
		case 16: // RUB
			return this._rub();
		case 17: // TOSS
			return this._throw();
		case 19: // FIND
		case 20: // INVN
			return this._find();
		case 21: // FEED
			return this._feed();
		case 22: // FILL
			return this._fill();
		case 23: // BLST
			return this._blast();
		case 27: // READ
			return this._read(wd1);
		case 28: // BREK
			return this._break();
		case 29: // WAKE
			return this._wake();
		default:
			this.bug(24);
		}
	},

	/**
	 * ANALYSE AN OBJECT WORD.  SEE IF THE THING IS HERE, WHETHER WE'VE GOT A VERB
	 * YET, AND SO ON.  OBJECT MUST BE HERE UNLESS VERB IS "FIND" OR "INVENT(ORY)"
	 * (AND NO NEW VERB YET TO BE ANALYSED).  WATER AND OIL ARE ALSO FUNNY, SINCE
	 * THEY ARE NEVER ACTUALLY DROPPED AT ANY LOCATION, BUT MIGHT BE HERE INSIDE
	 * THE BOTTLE OR AS A FEATURE OF THE LOCATION.
	 */
	_analyseObject: function(k, wd1, wd2) {
		this.obj = k;
		if (this.fixed[k-1] != this.loc && ! this.here(k)) {
			if (k == this.grate) {
				if (this.loc == 1 || this.loc == 4 || this.loc == 7) {
					k = this.dprssn;
				}
				if (this.loc > 9 && this.loc < 15) {
					k = this.entrnc;
				}
				if (k != this.grate)
					return this._motionVerb(k);
			}
			if (!this._checkObjectHere(k, wd1, wd2)) {
				return;
			}
		}
		// Label 5010
		if (wd2 != null) {
			return this._parseWord(wd2, null);
		}
		if (this.verb != 0) {
			return this._transitiveVerb(wd1, wd2);
		}
		// Label 5015
		this.println("What do you want to do with the " + wd1 + "?");
		return this._hint(0);
	},
	_checkObjectHere: function(k, wd1, wd2) {
		if (k == this.dwarf) {
			for (var i = 0; i < 5; i++) {
				if (this.dloc[i] == this.loc && this.dflag >= 2) {
					return true;
				}
			}
		}
		if ((this.liq() == k && this.here(this.bottle)) || k == this.liqloc(this.loc)) {
			return true;
		}
		if (this.obj == this.plant && this.at(this.plant2) && this.prop(this.plant2) != 0) {
			this.obj = this.plant2;
			return true;
		}
		if (this.obj == this.knife && this.knfloc == this.loc) {
			this.knfloc = -1;
			this._commandError(116);
			return false;
		}
		if (this.obj == this.rod && this.here(this.rod2)) {
			this.obj = this.rod2;
			return true;
		}
		if ((this.verb == this.find || this.verb == this.invent) && wd2 == null) {
			return true;
		}
		this.println(" I see no " + wd1 + " here.");
		this._getCommand();
		return false;
	},
	_motionVerb: function(k) {
		/* FIGURE OUT THE NEW LOCATION
		 *
		 * GIVEN THE CURRENT LOCATION IN "LOC", AND A MOTION VERB NUMBER IN "K",
		 * PUT THE NEW LOCATION IN "NEWLOC".  THE CURRENT LOC IS SAVED IN
		 * "OLDLOC" IN CASE HE WANTS TO RETREAT.  THE CURRENT OLDLOC IS SAVED IN
		 * OLDLC2, IN CASE HE DIES.  (IF HE DOES, NEWLOC WILL BE LIMBO, AND
		 * OLDLOC WILL BE WHAT KILLED HIM, SO WE NEED OLDLC2, WHICH IS THE LAST
		 * PLACE HE WAS SAFE.)
		 */
		// Label 8
		if (this.loc < 1 || this.loc >= logging.TRAVEL_KEY.length)
			this.bug(26);
		// NOTE: kk is a 0-based index for once, not a 1-based index!
		var kk = logging.TRAVEL_KEY[this.loc-1];

		this.newloc = this.loc;
		if (kk == null) {
			this.bug(26);
		}

		if (k == this.wdNull) {
			return this._nextTurn();
		} else if (k == this.back) {
			// Label 20
			// HANDLE "GO BACK".  LOOK FOR VERB WHICH GOES FROM LOC TO OLDLOC, OR TO OLDLC2
			// IF OLDLOC HAS FORCED-MOTION.  K2 SAVES ENTRY -> FORCED LOC -> PREVIOUS LOC.
			k = this.oldloc;
			if (this.forced(k)) {
				k = this.oldlc2;
			}
			this.oldlc2 = this.oldloc;
			this.oldloc = this.loc;
			var k2 = 0;
			if (k == this.loc) {
				this.rspeak(91);
				return this._nextTurn();
			}
			// Label 21
			while (true) {
				var ll = (Math.floor(Math.abs(logging.TRAVEL[kk])/1000)) % 1000;
				if (ll == k) {
					return this._motionVerbLabel22(kk);
				}
				if (ll <= 300) {
					var j = logging.TRAVEL_KEY[ll-1];
					if (this.forced(ll) && (Math.floor(Math.abs(logging.TRAVEL[j])/1000) % 1000) == k) {
						k2 = kk;
					}
				}
				if (logging.TRAVEL[kk] < 0) {
					kk = k2;
					if (kk == 0) {
						this.rspeak(140);
						return this._nextTurn();
					}
					return this._motionVerbLabel22(kk);
				}
				kk++;
			}
		} else if (k == this.look) {
			/*
			 * LOOK.  CAN'T GIVE MORE DETAIL.  PRETEND IT WASN'T DARK (THOUGH IT MAY "NOW"
			 * BE DARK) SO HE WON'T FALL INTO A PIT WHILE STARING INTO THE GLOOM.
			 */
			if (this.detail < 3) {
				this.rspeak(15);
			}
			this.detail++;
			this.wzdark = false;
			this.abb[this.loc-1] = 0;
			return this._nextTurn();
		} else if (k == this.cave) {
			// CAVE.  DIFFERENT MESSAGES DEPENDING ON WHETHER ABOVE GROUND.
			// Label 40
			this.rspeak(this.loc < 8 ? 57 : 58);
			return this._nextTurn();
		}
		this.oldlc2 = this.oldloc;
		this.oldloc = this.loc;
		this._motionVerbLabel9(k, kk);
	},
	_motionVerbLabel22: function(kk) {
		return this._motionVerbLabel9(Math.abs(logging.TRAVEL[kk]) % 1000,
				logging.TRAVEL_KEY[this.loc-1]);
	},
	/**
	 * Horrible hack to enable similar random jumping as in the original.
	 */
	_motionVerbLabel9: function(k, kk) {
		// Label 9
		var ll;
		while (true) {
			ll = Math.abs(logging.TRAVEL[kk]);
			var lm = ll % 1000;
			//this.println("k=" + k + ";kk=" + kk + ";ll=" + ll + ";lm=" + lm);
			if (lm == 1 || lm == k) {
				break;
			}
			if (logging.TRAVEL[kk] < 0) {
				return this._cantGoThatWay(k);
			}
			kk++;
		}
		// Label 10
		ll = Math.floor(ll / 1000);
		// Label 11
		while (true) {
			this.newloc = Math.floor(ll / 1000);
			k = this.newloc % 100;
			if (this.newloc <= 300) {
				// Label 13
				if (this.newloc <= 100) {
					// Label 14
					if (this.newloc == 0 || this.pct(this.newloc))
						break;
				} else if (this.toting(k) || this.newloc > 200 && this.at(k)) {
					// Quick check for special travel 302, which would otherwise
					// force a goto back here, and I'm not going to go through
					// the convoluted logic to try and allow that. All special
					// travel 302 does is drop the emerald.
					if ((ll % 1000) == 302) {
						// TRAVEL 302.  PLOVER TRANSPORT.  DROP THE EMERALD
						// (ONLY USE SPECIAL TRAVEL IF TOTING IT), SO HE'S
						// FORCED TO USE THE PLOVER-PASSAGE TO GET IT OUT.
						// HAVING DROPPED IT, GO BACK AND PRETEND HE WASN'T
						// CARRYING IT AFTER ALL.
						this.drop(this.emrald, this.loc);
					} else {
						break;
					}
				}
			} else if (this.prop(k) != (Math.floor(this.newloc/100)-3)) {
				break;
			}
			// Label 12
			while (true) {
				if (logging.TRAVEL[kk] < 0)
					this.bug(25);
				kk++;
				this.newloc = Math.floor(Math.abs(logging.TRAVEL[kk])/1000);
				if (this.newloc != ll) {
					ll = this.newloc;
					break;
				}
			}
		}
		// Label 16
		this.newloc = ll % 1000;
		if (this.newloc <= 300)
			return this._nextTurn();
		if (this.newloc <= 500) {
			// SPECIAL MOTIONS
			switch (this.newloc) {
			case 301:
				// TRAVEL 301.  PLOVER-ALCOVE PASSAGE.  CAN CARRY ONLY EMERALD.
				// NOTE: TRAVEL TABLE MUST INCLUDE "USELESS" ENTRIES GOING
				// THROUGH PASSAGE, WHICH CAN NEVER BE USED FOR ACTUAL MOTION,
				// BUT CAN BE SPOTTED BY "GO BACK".
				this.newloc = 199 - this.loc;
				if (this.holdng == 0 || (this.holdng == 1 && this.toting(this.emrald))) {
					return this._nextTurn();
				}
				this.newloc = this.loc;
				this.rspeak(117);
				return this._nextTurn();
			case 302:
				throw Error("Oops, special travel 302 dropped through.");
			case 303:
				// TRAVEL 303.  TROLL BRIDGE.  MUST BE DONE ONLY AS SPECIAL
				// MOTION SO THAT DWARVES WON'T WANDER ACROSS AND ENCOUNTER THE
				// BEAR.  (THEY WON'T FOLLOW THE PLAYER THERE BECAUSE THAT
				// REGION IS FORBIDDEN TO THE PIRATE.)  IF PROP(TROLL)=1, HE'S
				// CROSSED SINCE PAYING, SO STEP OUT AND BLOCK HIM.  (STANDARD
				// TRAVEL ENTRIES CHECK FOR PROP(TROLL)=0.)  SPECIAL STUFF FOR
				// BEAR.
				if (this.prop(this.troll) == 1) {
					this.pspeak(this.troll, 1);
					this.setProp(this.troll, 0);
					this.move(this.troll2, 0);
					this.move(this.troll2+100, 0);
					this.move(this.troll, logging.plac(this.troll));
					this.move(this.troll+100, logging.fixd(this.troll));
					this.juggle(this.chasm);
					this.newloc = this.loc;
					return this._nextTurn();
				} else {
					this.newloc = logging.plac(this.troll) + logging.fixd(this.troll) - this.loc;
					if (this.prop(this.troll) == 0) {
						this.setProp(this.troll, 1);
					}
					if (!this.toting(this.bear)) {
						return this._nextTurn();
					}
					this.rspeak(162);
					this.setProp(this.chasm, 1);
					this.setProp(this.troll, 2);
					this.drop(this.bear, this.newloc);
					this.fixed[this.bear-1] = -1;
					this.setProp(this.bear, 3);
					if (this.prop(this.spices) < 0) {
						this.tally2++;
					}
					this.oldlc2 = this.newloc;
					return this._died();
				}
			}
			// END OF SPECIALS.
			// If we've fallen through, it's a bug
			this.bug(20);
		}
		this.rspeak(this.newloc-500);
		this.newloc = this.loc;
		return this._nextTurn();
	},
	/**
	 * NON-APPLICABLE MOTION.  VARIOUS MESSAGES DEPENDING ON WORD GIVEN.
	 */
	_cantGoThatWay: function(k) {
		// Label 50
		var spk = 12;
		if (k >= 43 && k <= 50)
			spk = 9;
		if (k == 29 || k == 30)
			spk = 9;
		if (k == 7 || k == 36 || k == 37)
			spk = 10;
		if (k == 11 || k == 19)
			spk = 11;
		if (this.verb == this.find || this.verb == this.invent)
			spk = 59;
		if (k == 62 || k == 65)
			spk = 42;
		if (k == 17)
			spk = 80;
		this.rspeak(spk);
		return this._nextTurn();
	},
	/**
	 * "YOU'RE DEAD, JIM."
	 *
	 * IF THE CURRENT LOC IS ZERO, IT MEANS THE CLOWN GOT HIMSELF KILLED.  WE'LL
	 * ALLOW THIS MAXDIE TIMES.  MAXDIE IS AUTOMATICALLY SET BASED ON THE NUMBER OF
	 * SNIDE MESSAGES AVAILABLE.  EACH DEATH RESULTS IN A MESSAGE (81, 83, ETC.)
	 * WHICH OFFERS REINCARNATION; IF ACCEPTED, THIS RESULTS IN MESSAGE 82, 84,
	 * ETC.  THE LAST TIME, IF HE WANTS ANOTHER CHANCE, HE GETS A SNIDE REMARK AS
	 * WE EXIT.  WHEN REINCARNATED, ALL OBJECTS BEING CARRIED GET DROPPED AT OLDLC2
	 * (PRESUMABLY THE LAST PLACE PRIOR TO BEING KILLED) WITHOUT CHANGE OF PROPS.
	 * THE LOOP RUNS BACKWARDS TO ASSURE THAT THE BIRD IS DROPPED BEFORE THE CAGE.
	 * (THIS KLUGE COULD BE CHANGED ONCE WE'RE SURE ALL REFERENCES TO BIRD AND CAGE
	 * ARE DONE BY KEYWORDS.)  THE LAMP IS A SPECIAL CASE (IT WOULDN'T DO TO LEAVE
	 * IT IN THE CAVE).  IT IS TURNED OFF AND LEFT OUTSIDE THE BUILDING (ONLY IF HE
	 * WAS CARRYING IT, OF COURSE).  HE HIMSELF IS LEFT INSIDE THE BUILDING (AND
	 * HEAVEN HELP HIM IF HE TRIES TO XYZZY BACK INTO THE CAVE WITHOUT THE LAMP!).
	 * OLDLOC IS ZAPPED SO HE CAN'T JUST "RETREAT".
	 *
	 * THE EASIEST WAY TO GET KILLED IS TO FALL INTO A PIT IN PITCH DARKNESS.
	 */
	_fellIntoAPit: function() {
		// Label 90
		this.rspeak(23);
		this.oldlc2 = this.loc;
		return this._died();
	},
	/**
	 * OKAY, HE'S DEAD.  LET'S GET ON WITH IT.
	 */
	_died: function() {
		// Label 99
		if (this.closng) {
			// Label 95
			// HE DIED DURING CLOSING TIME.  NO RESURRECTION.  TALLY UP A DEATH AND EXIT.
			this.rspeak(131);
			this.numdie++;
			return this._endGame();
		}
		this.yes(81+(this.numdie*2), 82+(this.numdie*2), 54, function(yea) {
			// NOTE: We can use "this" here due to the way "yes" works
			this.numdie++;
			if (this.numdie >= this.maxdie || !yea) {
				return this._endGame();
			}
			this.place[this.water-1] = 0;
			this.place[this.oil-1] = 0;
			if (this.toting(this.lamp)) {
				this.setProp(this.lamp, 0);
			}
			for (var i = 100; i >= 1; i--) {
				if (this.toting(i)) {
					var k = this.oldlc2;
					if (i == this.lamp)
						k = 1;
					this.drop(i, k)
				}
			}
			this.loc = 3;
			this.oldloc = this.loc;
			this._describeLocation();
		});
	},
	/*
	 * ROUTINES FOR PERFORMING THE VARIOUS ACTION VERBS
	 *
	 * STATEMENT NUMBERS IN THIS SECTION ARE 8000 FOR INTRANSITIVE VERBS, 9000 FOR
	 * TRANSITIVE, PLUS TEN TIMES THE VERB NUMBER.  MANY INTRANSITIVE VERBS USE THE
	 * TRANSITIVE CODE, AND SOME VERBS USE CODE FOR OTHER VERBS, AS NOTED BELOW.
	 *
	 * RANDOM INTRANSITIVE VERBS COME HERE.  CLEAR OBJ JUST IN CASE (SEE "ATTACK").
	 */
	_toWhat: function() {
		// Label 8000
		this.println("What?");
		this.obj = 0;
		this._hint(0);
	},
	/**
	 * CARRY, NO OBJECT GIVEN YET.  OK IF ONLY ONE OBJECT PRESENT.
	 */
	_intransTake: function() {
		// Label 8010
		// Check to make sure only one thing is here...
		var here = this.atloc[this.loc-1];
		if (here == 0 || this.link[here-1] != 0) {
			return this._toWhat();
		}
		// ...and that no dwarves/pirates are here...
		for (var i = 0; i < 5; i++) {
			if (this.dloc[i] == this.loc && this.dflag >= 2) {
				return this._toWhat();
			}
		}
		// In which case...
		this.obj = here;
		return this._take();
	},
	/**
	 * CARRY AN OBJECT.  SPECIAL CASES FOR BIRD AND CAGE (IF BIRD IN CAGE, CAN'T
	 * TAKE ONE WITHOUT THE OTHER.  LIQUIDS ALSO SPECIAL, SINCE THEY DEPEND ON
	 * STATUS OF BOTTLE.  ALSO VARIOUS SIDE EFFECTS, ETC.
	 */
	_take: function() {
		// Label 9010
		if (this.toting(this.obj)) {
			return this._commandError(this.spk);
		}
		this.spk = 25;
		if (this.obj == this.plant && this.prop(this.plant) <= 0) {
			this.spk = 115;
		}
		if (this.obj == this.bear && this.prop(this.bear) == 1) {
			this.spk = 169;
		}
		if (this.obj == this.chain && this.prop(this.bear) != 0) {
			this.spk = 170;
		}
		if (this.fixed[this.obj-1] != 0) {
			return this._commandError(this.spk);
		}
		if (this.obj == this.water || this.obj == this.oil) {
			this.obj = this.bottle;
			if (this.here(this.bottle) && this.liq() == this.obj) {
			} else {
				if (this.toting(this.bottle) && this.prop(this.bottle) == 1) {
					return this._fill();
				}
				if (this.prop(this.bottle) != 1) {
					this.spk = 105;
				}
				if (!this.toting(this.bottle)) {
					this.spk = 104;
				}
				return this._commandError(this.spk);
			}
		}
		// Label 9017
		if (this.holdng >= 7) {
			return this._commandError(92);
		}
		// Label 9016
		if (this.obj == this.bird && this.prop(this.bird) == 0) {
			if (this.toting(this.rod)) {
				return this._commandError(26);
			}
			if (!this.toting(this.cage)) {
				return this._commandError(27);
			}
			this.setProp(this.bird, 1);
		}
		if ((this.obj == this.bird || this.obj == this.cage) && this.prop(this.bird) != 0) {
			this.carry(this.bird+this.cage-this.obj, this.loc);
		}
		this.carry(this.obj, this.loc);
		if (this.obj == this.bottle) {
			var k = this.liq();
			if (k != 0) {
				this.place[k-1] = -1;
			}
		}
		return this._commandSuccess();
	},
	/**
	 * DISCARD OBJECT.  "THROW" ALSO COMES HERE FOR MOST OBJECTS.  SPECIAL CASES
	 * FOR BIRD (MIGHT ATTACK SNAKE OR DRAGON) AND CAGE (MIGHT CONTAIN BIRD) AND
	 * VASE. DROP COINS AT VENDING MACHINE FOR EXTRA BATTERIES.
	 *
	 * Note that this is NOT the same as drop() which is used to implement
	 * dropping things.
	 */
	_drop: function() {
		// Label 9020
		if (this.toting(this.rod2) && this.obj == this.rod && (!this.toting(rod))) {
			this.obj = this.rod2;
		}
		if (!this.toting(this.obj)) {
			return this._commandError(this.spk);
		}
		if (this.obj == this.bird && this.here(this.snake)) {
			this.rspeak(30);
			if (this.closed) {
				return this._disturbDwarves();
			}
			this.destroy(this.snake);
			// SET PROP FOR USE BY TRAVEL OPTIONS
			this.setProp(this.snake, 1);
		} else if (this.obj == this.coins && this.here(this.vend)) {
			this.destroy(this.coins);
			this.drop(this.batter, this.loc);
			this.pspeak(this.batter, 0);
			return this._getCommand();
		} else if (this.obj == this.bird && this.at(this.dragon) && this.prop(this.dragon) != 0) {
			this.rspeak(154);
			this.destroy(this.bird);
			this.setProp(this.bird, 0);
			if (this.place[this.snake-1] == logging.plac(this.snake)) {
				this.tally2++;
			}
			return this._getCommand();
		} else if (this.obj == this.bear && this.at(this.troll)) {
			this.rspeak(163);
			this.move(this.troll, 0);
			this.move(this.troll+100, 0);
			this.move(this.troll2, logging.plac(this.troll));
			this.move(this.troll2+100, logging.fixd(this.troll));
			this.juggle(this.chasm);
			this.setProp(this.troll, 2);
		} else if (this.obj == this.vase) {
			if (this.loc == logging.plac(this.pillow)) {
				this.rspeak(54);
			} else {
				this.setProp(this.vase, this.at(this.pillow) ? 0 : 2);
				this.pspeak(this.vase, this.prop(this.vase)+1);
				if (this.prop(this.vase) != 0) {
					this.fixed[this.vase-1] = -1;
				}
			}
		}
		// Label 9021
		var k = this.liq();
		if (k == this.obj)
			this.obj = this.bottle;
		if (this.obj == this.bottle && k != 0)
			this.place[k-1] = 0;
		if (this.obj == this.cage && this.prop(this.bird) != 0) {
			this.drop(this.bird, this.loc);
		}
		if (this.obj == this.bird) {
			this.setProp(this.bird, 0);
		}
		this.drop(this.obj, this.loc);
		return this._getCommand();
	},
	_say: function(wd1, wd2) {
		// 9030
		if (wd2 != null)
			wd1 = wd2;
		var i = this.vocab(wd1, -1);
		if (i == 62 || i == 65 || i == 71 || i == 2025) {
			this.obj = 0;
			return this._parseWord(wd1, null);
		}
		this.println(" Okay, " + wd1);
		return this._getCommand();
	},
	/**
	 * LOCK, UNLOCK, NO OBJECT GIVEN.  ASSUME VARIOUS THINGS IF PRESENT.
	 */
	_intransLock: function() {
		// Label 8040
		this.spk = 28;
		if (this.here(this.clam)) {
			this.obj = this.clam;
		}
		if (this.here(this.oyster)) {
			this.obj = this.oyster;
		}
		if (this.at(this.door)) {
			this.obj = this.door;
		}
		if (this.at(this.grate)) {
			this.obj = this.grate;
		}
		if (this.obj != 0 && this.here(this.chain)) {
			return this._toWhat();
		}
		if (this.here(this.chain)) {
			this.obj = this.chain;
		}
		if (this.obj == 0) {
			return this._commandError(this.spk);
		}
		this._lock();
	},
	_lock: function() {
		// Label 9040
		if (this.obj == this.clam || this.obj == this.oyster) {
			// CLAM/OYSTER.
			var k = this.obj == this.oyster ? 1 : 0;
			var spk = 124 + k;
			if (this.toting(this.obj)) {
				spk = 120 + k;
			}
			if (!this.toting(this.tridnt)) {
				spk = 122 + k;
			}
			if (this.verb == this.lock) {
				spk = 61;
			}
			if (spk == 124) {
				this.destroy(this.clam);
				this.drop(this.oyster, this.loc);
				this.drop(this.pearl, 105);
			}
			return this._commandError(spk);
		}
		if (this.obj == this.door) {
			this.spk = 111;
		}
		if (this.obj == this.door && this.prop(this.door) == 1) {
			this.spk = 54;
		}
		if (this.obj == this.cage) {
			this.spk = 32;
		}
		if (this.obj == this.keys) {
			this.spk = 55;
		}
		if (this.obj == this.grate || this.obj == this.chain) {
			this.spk = 31;
		}
		if (this.spk != 31 || (!this.here(this.keys))) {
			return this._commandError(this.spk);
		}
		if (this.obj == this.chain) {
			// CHAIN.
			if (this.verb == this.lock) {
				var spk = 172;
				if (this.prop(this.chain) != 0) {
					spk = 34;
				}
				if (this.loc != logging.plac(this.chain)) {
					spk = 173;
				}
				if (spk == 172) {
					this.setProp(this.chain, 2);
					if (this.toting(this.chain)) {
						this.drop(this.chain, this.loc);
					}
					this.fixed[this.chain-1] = -1;
				}
				return this._commandError(spk);
			} else {
				var spk = 171;
				if (this.prop(this.bear) == 0)
					spk = 41;
				if (this.prop(this.chain) == 0)
					spk = 37;
				if (spk == 171) {
					this.setProp(this.chain, 0);
					this.fixed[this.chain-1] = 0;
					if (this.prop(this.bear) != 3) {
						this.setProp(this.bear, 2);
					}
					this.fixed[this.bear-1] = 2-this.prop(this.bear);
				}
				return this._commandError(spk);
			}
		}
		if (!this.closng) {
			var k = 34 + this.prop(this.grate);
			this.setProp(this.grate, 1);
			if (this.verb == this.lock) {
				this.setProp(this.grate, 0);
			}
			k = k + 2*this.prop(this.grate);
			return this._commandError(k);
		}
		if (!this.panic) {
			this.clock2 = 15;
			this.panic = true;
		}
		return this._commandError(130);
	},
	/**
	 * LIGHT LAMP
	 */
	_lightLamp: function() {
		// Label 9070
		if (!this.here(this.lamp)) {
			return this._commandError(this.spk);
		}
		if (this.limit < 0) {
			return this._commandError(184);
		}
		this.setProp(this.lamp, 1);
		this.rspeak(39);
		if (this.wzdark) {
			this._describeLocation();
		} else {
			this._getCommand();
		}
	},
	/**
	 * Lamp off.
	 */
	_lampOff: function() {
		// Label 9080
		if (!this.here(this.lamp)) {
			return this._commandError(this.spk);
		}
		this.setProp(this.lamp, 0);
		this.rspeak(40);
		if (this.dark()) {
			this.rspeak(16);
		}
		this._getCommand();
	},
	/**
	 * WAVE.  NO EFFECT UNLESS WAVING ROD AT FISSURE.
	 */
	_wave: function() {
		// Label 9090
		if ((!this.toting(this.obj)) && (this.obj != this.rod || (!(this.toting(this.rod2)))))
			this.spk = 29;
		if (this.obj != this.rod || (!this.at(this.fissur)) || (!this.toting(this.obj)) || this.closng) {
			return this._commandError(this.spk);
		}
		this.setProp(this.fissur, 1-this.prop(this.fissur));
		this.pspeak(this.fissur, 2-this.prop(this.fissur));
		return this._getCommand();
	},
	/**
	 * ATTACK.  ASSUME TARGET IF UNAMBIGUOUS.  "THROW" ALSO LINKS HERE.
	 * ATTACKABLE OBJECTS FALL INTO TWO CATEGORIES: ENEMIES (SNAKE, DWARF, ETC.)
	 * AND OTHERS (BIRD, CLAM).  AMBIGUOUS IF TWO ENEMIES, OR IF NO ENEMIES BUT
	 * TWO OTHERS.
	 */
	_attack: function() {
		// Label 9120
		var i;
		// This is a bit different - basically, we're checking if there is a
		// dwarf around to attack. If there is, we break early.
		for (i = 0; i < 5; i++) {
			if (this.dloc[i] == this.loc && this.dflag >= 2)
				break;
		}
		// If there isn't, i=5.
		// Label 9122
		if (this.obj == 0) {
			// If no object, pick one.
			// The original used 0 to mean "no dwarf" but 0 is a valid index in
			// JavaScript, so we use ">=5" to mean "no dwarf."
			if (i < 5) {
				this.obj = this.dwarf;
			}
			if (this.here(this.snake)) {
				this.obj = this.obj*100+this.snake;
			}
			if (this.at(this.dragon) && this.prop(this.dragon) == 0) {
				this.obj = this.obj*100+this.dragon;
			}
			if (this.at(this.troll)) {
				this.obj = this.obj*100+this.troll;
			}
			if (this.here(this.bear) && this.prop(this.bear) == 0) {
				this.obj = this.obj*100+this.bear;
			}
			if (this.obj > 100) {
				return this._toWhat();
			}
			if (this.obj == 0) {
				// Still haven't found anything
				// CAN'T ATTACK BIRD BY THROWING AXE.
				if (this.here(this.bird) && this.verb != this.wdThrow) {
					this.obj = this.bird;
				}
				// CLAM AND OYSTER BOTH TREATED AS CLAM FOR INTRANSITIVE CASE;
				// NO HARM DONE.
				if (this.here(this.clam) || this.here(this.oyster)) {
					this.obj = 100*this.obj+this.clam;
				}
				if (this.obj > 100) {
					return this._toWhat();
				}
			}
		}
		// Label 9124
		if (this.obj == this.bird) {
			if (this.closed) {
				return this._commandError(137);
			}
			this.destroy(this.bird);
			this.setProp(this.bird, 0);
			if (this.place[this.snake-1] == logging.plac(this.snake)) {
				this.tally2++;
			}
			this.spk = 45;
		}
		// Label 9125
		if (this.obj == 0) {
			this.spk = 44;
		}
		if (this.obj == this.clam || this.obj == this.oyster) {
			this.spk = 150;
		}
		if (this.obj == this.snake) {
			this.spk = 46;
		}
		if (this.obj == this.dwarf) {
			this.spk = 49;
		}
		if (this.obj == this.dwarf && this.closed) {
			return this._disturbDwarves();
		}
		if (this.obj == this.dragon) {
			this.spk = 167;
		}
		if (this.obj == this.troll) {
			this.spk = 157;
		}
		if (this.obj == this.bear) {
			this.spk = 165 + ((this.prop(this.bear)+1)>>1);
		}
		if (this.obj != this.dragon || this.prop(this.dragon) != 0) {
			return this._commandError(this.spk);
		}
		// FUN STUFF FOR DRAGON.  IF HE INSISTS ON ATTACKING IT, WIN!  SET
		// PROP TO DEAD, MOVE DRAGON TO CENTRAL LOC (STILL FIXED), MOVE RUG
		// THERE (NOT FIXED), AND MOVE HIM THERE, TOO.  THEN DO A NULL
		// MOTION TO GET NEW DESCRIPTION.
		this.rspeak(49);
		this.verb = 0;
		this.obj = 0;
		var self = this;
		return this.getin(function(m) {
			m = m.toUpperCase();
			if (m != 'Y' && m != 'YES') {
				// I *think* this is right for GOTO 2608.
				return self._command(m);
			}
			self.pspeak(self.dragon, 1);
			self.setProp(self.dragon, 2);
			self.setProp(self.rug, 0);
			var k = (logging.plac(self.dragon) + logging.fixd(self.dragon)) >> 1;
			self.move(self.dragon+100, -1);
			self.move(self.rug+100, 0);
			self.move(self.dragon, k);
			self.move(self.rug, k);
			for (var i = 1; i <= 100; i++) {
				if (self.place[i-1] == logging.plac(self.dragon) ||
					self.place[i-1] == logging.fixd(self.dragon)) {
						self.move(i, k);
				}
			}
			self.loc = k;
			return self._motionVerb(k);
		});
	},
	/**
	 * POUR.  IF NO OBJECT, OR OBJECT IS BOTTLE, ASSUME CONTENTS OF BOTTLE.
	 * SPECIAL TESTS FOR POURING WATER OR OIL ON PLANT OR RUSTY DOOR.
	 */
	_pour: function() {
		// Label 9130
		if (this.obj == this.bottle || this.obj == 0) {
			this.obj = this.liq();
		}
		if (this.obj == 0) {
			return this._toWhat();
		}
		if (!this.toting(this.obj)) {
			return this._commandError(this.spk);
		}
		if (this.obj != this.oil && this.obj != this.water) {
			return this._commandError(78);
		}
		this.setProp(this.bottle, 1);
		this.place[this.obj-1] = 0;
		if (!(this.at(this.plant) || this.at(this.door))) {
			return this._commandError(77);
		}
		if (this.at(this.door)) {
			this.setProp(this.door, 0);
			if (this.obj == this.oil) {
				this.setProp(this.door, 1);
			}
			return this._commandError(113 + this.prop(this.door));
		}
		if (this.obj != this.water) {
			return this._commandError(112);
		}
		this.pspeak(this.plant, this.prop(this.plant)+1);
		this.setProp(this.plant, (this.prop(this.plant)+2)%6);
		this.setProp(this.plant2, Math.floor(this.prop(this.plant)/2));
		return this._motionVerb(this.wdNull);
	},
	/**
	 * EAT.  INTRANSITIVE: ASSUME FOOD IF PRESENT, ELSE ASK WHAT.
	 */
	_intransEat: function() {
		// Label 8140
		if (!this.here(this.food)) {
			return this._toWhat();
		}
		// Label 8142
		this.destroy(this.food);
		return this._commandError(72);
	},
	/**
	 * EAT.  TRANSITIVE: FOOD OK, SOME THINGS LOSE APPETITE, REST ARE RIDICULOUS.
	 */
	_eat: function() {
		// Label 9140
		if (this.obj == this.food) {
			// GOTO 8142
			// Rather than actually jump, just copy-paste:
			this.destroy(this.food);
			return this._commandError(72);
		}
		if (this.obj == this.bird || this.obj == this.snake ||
				this.obj == this.clam || this.obj == this.oyster ||
				this.obj == this.dwarf || this.obj == this.dragon ||
				this.obj == this.troll || this.obj == this.bear) {
			return this._commandError(71);
		}
		return this._commandError(this.spk);
	},
	/**
	 * DRINK.  IF NO OBJECT, ASSUME WATER AND LOOK FOR IT HERE.  IF WATER IS IN
	 * THE BOTTLE, DRINK THAT, ELSE MUST BE AT A WATER LOC, SO DRINK STREAM.
	 */
	_drink: function() {
		// Label 9150
		if (this.obj == 0 && this.liqloc(this.loc) != this.water &&
				(this.liq() != this.water || !this.here(this.bottle))) {
			return this._toWhat();
		}
		if (this.obj != 0 && this.obj != this.water) {
			this.spk = 110;
		}
		if (this.spk != 110 && this.liq() == this.water &&
				this.here(this.bottle)) {
			this.setProp(this.bottle, 1);
			this.place[this.water-1] = 0;
			this.spk = 74;
		}
		return this._commandError(this.spk);
	},
	/**
	 * RUB.  YIELDS VARIOUS SNIDE REMARKS.
	 */
	_rub: function() {
		// Label 9160
		if (this.obj != this.lamp)
			this.spk = 76;
		return this._commandError(this.spk);
	},
	/**
	 * THROW.  SAME AS DISCARD UNLESS AXE.  THEN SAME AS ATTACK EXCEPT IGNORE
	 * BIRD, AND IF DWARF IS PRESENT THEN ONE MIGHT BE KILLED.  (ONLY WAY TO DO
	 * SO!)  AXE ALSO SPECIAL FOR DRAGON, BEAR, AND TROLL.  TREASURES SPECIAL
	 * FOR TROLL.
	 */
	_throw: function() {
		// Label 9170
		if (this.toting(this.rod2) && this.obj == this.rod && (!this.toting(this.rod))) {
			this.obj = this.rod2;
		}
		if (!this.toting(this.obj)) {
			return this._commandError(this.spk);
		}
		if (this.obj >= 50 && this.obj <= this.maxtrs && this.at(this.troll)) {
			// SNARF A TREASURE FOR THE TROLL.
			this.drop(this.obj, 0);
			this.move(this.troll, 0);
			this.move(this.troll+100, 0);
			this.drop(this.troll2, logging.plac(this.troll));
			this.drop(this.troll2+100, logging.fixd(this.troll));
			this.juggle(this.chasm);
			return this._commandError(159);
		}
		if (this.obj == this.food && this.here(this.bear)) {
			// BUT THROWING FOOD IS ANOTHER STORY.
			// That comment originally came after the block where you throw the
			// axe at the bear - in this case, we're feeding the bear.
			this.obj = this.bear;
			return this._feed();
		}
		if (this.obj != this.axe) {
			return this._drop();
		}
		// Label 9171
		for (var i = 0; i < 5; i++) {
			// NEEDN'T CHECK DFLAG IF AXE IS HERE.
			if (this.dloc[i] == this.loc) {
				if (this.ran(3) == 0) {
					return this._throwAxe(48);
				}
				this.dseen[i] = false;
				this.dloc[i] = 0;
				this.dkill++;
				return this._throwAxe(this.dkill == 1 ? 149 : 47);
			}
		}
		if (this.at(this.dragon) && this.prop(this.dragon) == 0) {
			return this._throwAxe(152);
		}
		if (this.at(this.troll)) {
			return this._throwAxe(158);
		}
		if (this.here(this.bear) && this.prop(this.bear) == 0) {
			// THIS'LL TEACH HIM TO THROW THE AXE AT THE BEAR!
			this.drop(this.axe, this.loc);
			this.fixed[this.axe-1] = -1;
			this.setProp(this.axe, 1);
			this.juggle(this.bear);
			return this._commandError(164);
		}
		this.obj = 0;
		return this._attack();
	},
	/**
	 * Joo want axe?
	 */
	_throwAxe: function(spk) {
		// Label 9175
		this.rspeak(spk);
		this.drop(this.axe, this.loc);
		return this._motionVerb(this.wdNull);
	},
	/**
	 * QUIT.  INTRANSITIVE ONLY.  VERIFY INTENT AND EXIT IF THAT'S WHAT HE WANTS.
	 */
	_quit: function() {
		// Label 8180
		this.yes(22, 54, 54, function(gaveup) {
			if (gaveup) {
				this.gaveup = true;
				this._endGame();
			} else {
				this._getCommand();
			}
		});
	},
	/**
	 * FIND.  MIGHT BE CARRYING IT, OR IT MIGHT BE HERE.  ELSE GIVE CAVEAT.
	 */
	_find: function() {
		// Label 9190
		if (this.at(this.obj) || (this.liq()==this.obj && this.at(this.bottle)) ||
				this.verb == this.liqloc(this.loc)) {
			this.spk = 94;
		}
		for (var i = 0; i < 5; i++) {
			if (this.dloc[i] == this.loc && this.dflag >= 2 && this.obj == this.dwarf) {
				this.spk = 94;
			}
		}
		if (this.closed) {
			this.spk = 138;
		}
		if (this.toting(this.obj)) {
			this.spk = 24;
		}
		this._commandError(this.spk);
	},

	/**
	 * INVENTORY.  IF OBJECT, TREAT SAME AS FIND.  ELSE REPORT ON CURRENT BURDEN.
	 */
	_inventory: function() {
		// label 8200
		var spk = 98;
		for (var i = 1; i <= 100; i++) {
			if (i != this.bear && this.toting(i)) {
				if (spk == 98) {
					this.rspeak(99);
				}
				this.blklin = false;
				this.pspeak(i, -1);
				this.blklin = true;
				spk = 0;
			}
		}
		if (this.toting(this.bear))
			spk = 141;
		return this._commandError(spk);
	},
	/**
	 * FEED.  IF BIRD, NO SEED.  SNAKE, DRAGON, TROLL: QUIP.  IF DWARF, MAKE HIM
	 * MAD.  BEAR, SPECIAL.
	 */
	_feed: function() {
		// Label 9210
		if (this.obj == this.bird) {
			return this._commandError(100);
		}
		if (this.obj == this.snake || this.obj == this.dragon || this.obj == this.troll) {
			var spk = 102;
			if (this.obj == this.dragon && this.prop(this.dragon) != 0) {
				// I have half a mind to alter this to allow you to feed the
				// dragon with yourself.
				spk = 110;
			}
			if (this.obj == this.troll) {
				spk = 182;
			}
			if (this.obj == this.snake && !this.closed && this.here(this.bird)) {
				spk = 101;
				this.destroy(this.bird);
				this.setProp(this.bird, 0);
				this.tally2++;
			}
			return this._commandError(spk);
		}
		if (this.obj == this.dwarf) {
			if (!this.here(this.food)) {
				return this._commandError(this.spk);
			} else {
				this.dflag++;
				return this._commandError(103);
			}
		}
		if (this.obj == this.bear) {
			if (this.prop(this.bear) == 0)
				this.spk = 102;
			if (this.prop(this.bear) == 3)
				this.spk = 110;
			if (!this.here(this.food))
				return this._commandError(this.spk);
			this.destroy(this.food);
			this.setProp(this.bear, 1);
			this.fixed[this.axe-1] = 0;
			this.setProp(this.axe, 0);
			return this._commandError(168);
		}
		return this._commandError(14);
	},
	/**
	 * FILL.  BOTTLE MUST BE EMPTY, AND SOME LIQUID AVAILABLE.  (VASE IS NASTY.)
	 */
	_fill: function() {
		// Label 9220
		if (this.obj == this.vase) {
			var spk = 29;
			if (this.liqloc(this.loc) == 0) {
				spk = 144;
			}
			if (this.liqloc(this.loc) == 0 || !this.toting(this.vase)) {
				return this._commandError(spk);
			}
			this.rspeak(145);
			// The original jumped to 9024 at this point, which
			// I'm guessing is a typo for 9021. In any case, it makes
			// absolutely no sense to go there, other than to possibly print
			// a random "OK" if done in the room with the pillow.
			// So, what the heck, this should match the behavior, despite it
			// not making a lick of sense:
			if (this.loc == logging.plac(this.pillow)) {
				this.rspeak(54);
			} else if (this.at(this.pillow)) {
				this.setProp(this.vase, 0);
			} else {
				this.setProp(this.vase, 2);
				this.fixed[this.vase-1] = -1;
			}
			this.drop(this.vase, this.loc);
			return this._getCommand();
		} else {
			if (this.obj != 0 && this.obj != this.bottle) {
				return this._commandError(this.spk);
			}
			if (this.obj == 0 && !(this.here(this.bottle))) {
				return this._toWhat();
			}
			var spk = 107;
			if (this.liqloc(this.loc) == 0) {
				spk = 106;
			}
			if (this.liq() != 0) {
				spk = 105;
			}
			if (spk == 107) {
				// Mmmm, horrible. Bit 2 in the condition is what the liquid is,
				// and it just so happens that anding it out exactly equals the
				// bottle property used to indicate what it's carrying.
				// What about that.
				this.setProp(this.bottle, logging.cond(this.loc) & 2);
				var k = this.liq();
				if (this.toting(this.bottle)) {
					this.place[k-1] = -1;
				}
				if (k == this.oil) {
					spk = 108;
				}
			}
			return this._commandError(spk);
		}
	},
	/**
	 * BLAST.  NO EFFECT UNLESS YOU'VE GOT DYNAMITE, WHICH IS A NEAT TRICK!
	 */
	_blast: function() {
		// Label 9230
		if (this.prop(this.rod2) < 0 || !this.closed) {
			return this._commandError(this.spk);
		}
		this.bonus = 133;
		if (this.loc == 115) {
			this.bonus = 134;
		}
		if (this.here(this.rod2)) {
			this.bonus = 135;
		}
		this.rspeak(this.bonus);
		return this._endGame();
	},
	/**
	 * SCORE.
	 */
	_scoreVerb: function() {
		// Label 8240
		this._score(true);
		return this.yes(143, 54, 54, function(yea) {
			this.gaveup = yea;
			if (yea) {
				return this._endGame();
			} else {
				return this._getCommand();
			}
		});
	},
	/**
	 * FEE FIE FOE FOO (AND FUM).  ADVANCE TO NEXT STATE IF GIVEN IN PROPER ORDER.
	 *
	 * LOOK UP WD1 IN SECTION 3 OF VOCAB TO DETERMINE WHICH WORD WE'VE GOT.  LAST
	 * WORD ZIPS THE EGGS BACK TO THE GIANT ROOM (UNLESS ALREADY THERE).
	 */
	_foo: function(wd1) {
		// Label 8250
		var k = this.vocab(wd1, 3);
		var spk = 42;
		if (this.foobar == (1-k)) {
			this.foobar = k;
			if (k != 4) {
				return this._commandSuccess();
			}
			this.foobar = 0;
			if (this.place[this.eggs-1] == logging.plac(this.eggs) ||
				this.toting(this.eggs) && this.loc == logging.plac(this.eggs)) {
				return this._commandError(spk);
			}
			// BRING BACK TROLL IF WE STEAL THE EGGS BACK FROM HIM BEFORE CROSSING.
			if (this.place[this.eggs-1] == 0 && this.place[this.troll-1] == 0 && this.prop(this.troll) == 0) {
				this.setProp(this.troll, 1);
			}
			k = 2;
			if (this.here(this.eggs)) {
				k = 1;
			}
			if (this.loc == logging.plac(this.eggs)) {
				k = 0;
			}
			this.move(this.eggs, logging.plac(this.eggs));
			this.pspeak(this.eggs, k);
			return this._getCommand();
		}
		if (this.foobar != 0) {
			spk = 151;
		}
		return this._commandError(spk);
	},

	/**
	 * BRIEF.  INTRANSITIVE ONLY.  SUPPRESS LONG DESCRIPTIONS AFTER FIRST TIME.
	 */
	_brief: function() {
		// Label 8260
		this.abbnum = 10000;
		this.detail = 3;
		return this._commandError(156);
	},
	/**
	 * READ.  MAGAZINES IN DWARVISH, MESSAGE WE'VE SEEN, AND . . . OYSTER?
	 */
	_readIntrans: function(wd1) {
		// Label 8270
		if (this.here(this.magzin)) {
			this.obj = this.magzin;
		}
		if (this.here(this.tablet)) {
			this.obj = this.obj*100 + this.tablet;
		}
		if (this.here(this.messag)) {
			this.obj = this.obj*100 + this.message;
		}
		if (this.closed && this.toting(this.oyster)) {
			this.obj = this.oyster;
		}
		if (this.obj > 100 || this.obj == 0 || this.dark()) {
			return this._toWhat();
		}
		this._read(wd1);
	},
	_read: function(wd1) {
		// Label 9270
		if (this.dark()) {
			this.println(" I see no " + wd1 + " here.");
			return this._getCommand();
		}
		if (this.obj == this.magzin)
			this.spk = 190;
		if (this.obj == this.tablet)
			this.spk = 196;
		if (this.obj == this.messag)
			this.spk = 191;
		if (this.obj == this.oyster) {
			if (this.toting(this.oyster)) {
				if (this.hinted[1]) {
					this.spk = 194;
				} else {
					// Check to make sure the player really wants to blow a hint.
					return this.yes(192, 193, 54, function(yea) {
						this.hinted[1] = yea;
						return this._getCommand();
					});
				}
			}
		}
		return this._commandError(this.spk);
	},
	/**
	 * BREAK.  ONLY WORKS FOR MIRROR IN REPOSITORY AND, OF COURSE, THE VASE.
	 */
	_break: function() {
		// Label 9280
		if (this.obj == this.mirror) {
			this.spk = 148;
		}
		if (this.obj == this.vase && this.prop(this.vase) == 0) {
			if (this.toting(this.vase)) {
				this.drop(this.vase, this.loc);
			}
			this.setProp(this.vase, 2);
			this.fixed[this.vase-1] = -1;
			return this._commandError(198);
		}
		if (this.obj != this.mirror || !this.closed) {
			return this._commandError(this.spk);
		}
		this.rspeak(197);
		return this._disturbDwarves();
	},
	/**
	 * WAKE.  ONLY USE IS TO DISTURB THE DWARVES.
	 */
	_wake: function() {
		// Label 9290
		if (this.obj == this.dwarf && this.closed) {
			this.rspeak(199);
			return this._disturbDwarves();
		}
		return this._commandError(this.spk);
	},
	/**
	 * SUSPEND.  OFFER TO EXIT LEAVING THINGS RESTARTABLE, BUT REQUIRING A DELAY
	 * BEFORE RESTARTING (SO CAN'T SAVE THE WORLD BEFORE TRYING SOMETHING RISKY).
	 * UPON RESTARTING, SETUP=-1 CAUSES RETURN TO 8305 TO PICK UP AGAIN.
	 *
	 * Actually, this does nothing.
	 */
	_suspend: function() {
		// Label 8300
		// Never a demo, so never say 201
		// The original just dumped the core image and then reloaded it.
		//          --------10--------20--------30--------40--------50--------60--------70
		this.speak("Sorry, Save doesn't work in this version!");
		return this._getCommand();
	},
	/**
	 * HOURS.  REPORT CURRENT NON-PRIME-TIME HOURS.
	 */
	_hours: function() {
		this.speak("COLOSSAL CAVE IS OPEN TO REGULAR ADVENTURERS AT THE FOLLOWING HOURS:");
		// Yeah, not an issue any more.
		//            --------10--------20--------30--------40--------50--------60--------70
		this.println("    Since this is a JavaScript application running on your own\n" +
					 "    computer, the cave is always open.  But thanks for asking.\n");
		return this._getCommand();
	},
	/*
	 * HINTS
	 *
	 * COME HERE IF HE'S BEEN LONG ENOUGH AT REQUIRED LOC(S) FOR SOME UNUSED HINT.
	 * HINT NUMBER IS IN VARIABLE "HINT".  BRANCH TO QUICK TEST FOR ADDITIONAL
	 * CONDITIONS, THEN COME BACK TO DO NEAT STUFF.  GOTO 40010 IF CONDITIONS ARE
	 * MET AND WE WANT TO OFFER THE HINT.  GOTO 40020 TO CLEAR HINTLC BACK TO ZERO,
	 * 40030 TO TAKE NO ACTION YET.
	 */
	/**
	 * This is implemented somewhat differently, since we can't block while
	 * waiting for the user to accept a hint. (Actually, I suppose we could if
	 * I were willing to use window.confirm, which I'm not, because I hate
	 * useless modal dialogs.) In any case, all this does is return true if it's
	 * OK to ask the user if they're willing to see the hint, and false if it
	 * isn't.
	 * @param {number} hint the 0-based index of the hint - NOT the original
	 * Fortran index!
	 */
	_hintActive: function(hint) {
		switch (hint) {
		case 3: // CAVE
			if (this.prop(this.grate) == 0 && !this.here(this.keys)) {
				return true;
			} else {
				// Otherwise, reset the 0-based index of the hint.
				this.hintlc[3] = 0;
				return false;
			}
		case 4: // BIRD
			return this.here(this.bird) && this.toting(this.rod) &&
					this.obj == this.bird;
		case 5: // SNAKE
			if (this.here(this.snake) && !this.here(this.bird)) {
				return true;
			} else {
				this.hintlc[5] = 0;
				return false;
			}
		case 6: // MAZE
			if (this.atloc[this.loc-1] == 0 && this.atloc[this.oldloc-1] == 0
					&& this.atloc[this.oldlc2-1] == 0 && this.holdng > 1) {
				return true;
			} else {
				this.hintlc[6] = 0;
				return false;
			}
		case 7: // DARK
		if (this.prop(this.emrald) != -1 && this.prop(this.pyram) == -1) {
			return true;
		} else {
			this.hintlc[7] = 0;
			return false;
		}
		case 8: // WITT
			return true;
		default:
			this.bug(27);
		}
	},
	/*
	 * CAVE CLOSING AND SCORING
	 *
	 * THESE SECTIONS HANDLE THE CLOSING OF THE CAVE.  THE CAVE CLOSES "CLOCK1"
	 * TURNS AFTER THE LAST TREASURE HAS BEEN LOCATED (INCLUDING THE PIRATE'S
	 * CHEST, WHICH MAY OF COURSE NEVER SHOW UP).  NOTE THAT THE TREASURES NEED NOT
	 * HAVE BEEN TAKEN YET, JUST LOCATED.  HENCE CLOCK1 MUST BE LARGE ENOUGH TO GET
	 * OUT OF THE CAVE (IT ONLY TICKS WHILE INSIDE THE CAVE).  WHEN IT HITS ZERO,
	 * WE BRANCH TO 10000 TO START CLOSING THE CAVE, AND THEN SIT BACK AND WAIT FOR
	 * HIM TO TRY TO GET OUT.  IF HE DOESN'T WITHIN CLOCK2 TURNS, WE CLOSE THE
	 * CAVE; IF HE DOES TRY, WE ASSUME HE PANICS, AND GIVE HIM A FEW ADDITIONAL
	 * TURNS TO GET FRANTIC BEFORE WE CLOSE.  WHEN CLOCK2 HITS ZERO, WE BRANCH TO
	 * 11000 TO TRANSPORT HIM INTO THE FINAL PUZZLE.  NOTE THAT THE PUZZLE DEPENDS
	 * UPON ALL SORTS OF RANDOM THINGS.  FOR INSTANCE, THERE MUST BE NO WATER OR
	 * OIL, SINCE THERE ARE BEANSTALKS WHICH WE DON'T WANT TO BE ABLE TO WATER,
	 * SINCE THE CODE CAN'T HANDLE IT.  ALSO, WE CAN HAVE NO KEYS, SINCE THERE IS A
	 * GRATE (HAVING MOVED THE FIXED OBJECT!) THERE SEPARATING HIM FROM ALL THE
	 * TREASURES.  MOST OF THESE PROBLEMS ARISE FROM THE USE OF NEGATIVE PROP
	 * NUMBERS TO SUPPRESS THE OBJECT DESCRIPTIONS UNTIL HE'S ACTUALLY MOVED THE
	 * OBJECTS.
	 *
	 * WHEN THE FIRST WARNING COMES, WE LOCK THE GRATE, DESTROY THE BRIDGE, KILL
	 * ALL THE DWARVES (AND THE PIRATE), REMOVE THE TROLL AND BEAR (UNLESS DEAD),
	 * AND SET "CLOSNG" TO TRUE.  LEAVE THE DRAGON; TOO MUCH TROUBLE TO MOVE IT.
	 * FROM NOW UNTIL CLOCK2 RUNS OUT, HE CANNOT UNLOCK THE GRATE, MOVE TO ANY
	 * LOCATION OUTSIDE THE CAVE (LOC<9), OR CREATE THE BRIDGE.  NOR CAN HE BE
	 * RESURRECTED IF HE DIES.  NOTE THAT THE SNAKE IS ALREADY GONE, SINCE HE GOT
	 * TO THE TREASURE ACCESSIBLE ONLY VIA THE HALL OF THE MT. KING.  ALSO, HE'S
	 * BEEN IN GIANT ROOM (TO GET EGGS), SO WE CAN REFER TO IT.  ALSO ALSO, HE'S
	 * GOTTEN THE PEARL, SO WE KNOW THE BIVALVE IS AN OYSTER.  *AND*, THE DWARVES
	 * MUST HAVE BEEN ACTIVATED, SINCE WE'VE FOUND CHEST.
	 */
	_caveClosing: function() {
		// Label 10000
		this.setProp(this.grate, 0);
		this.setProp(this.fissur, 0);
		for (var i = 0; i < 6; i++) {
			this.dseen[i] = false;
			this.dloc[i] = 0;
		}
		this.move(this.troll, 0);
		this.move(this.troll+100, 0);
		this.move(this.troll2, logging.plac(this.troll));
		this.move(this.troll2+100, logging.fixd(this.troll));
		this.juggle(this.chasm);
		if (this.prop(this.bear) != 3) {
			this.destroy(this.bear);
		}
		this.setProp(this.chain, 0);
		this.fixed[this.chain-1] = 0;
		this.setProp(this.axe, 0);
		this.fixed[this.axe-1] = 0;
		this.rspeak(129);
		this.clock1 = -1;
		this.closng = true;
		throw Error("GOTO 19999");
	},

	/*
	 * ONCE HE'S PANICKED, AND CLOCK2 HAS RUN OUT, WE COME HERE TO SET UP THE
	 * STORAGE ROOM.  THE ROOM HAS TWO LOCS, HARDWIRED AS 115 (NE) AND 116 (SW).
	 * AT THE NE END, WE PLACE EMPTY BOTTLES, A NURSERY OF PLANTS, A BED OF
	 * OYSTERS, A PILE OF LAMPS, RODS WITH STARS, SLEEPING DWARVES, AND HIM.  AND
	 * THE SW END WE PLACE GRATE OVER TREASURES, SNAKE PIT, COVEY OF CAGED BIRDS,
	 * MORE RODS, AND PILLOWS.  A MIRROR STRETCHES ACROSS ONE WALL.  MANY OF THE
	 * OBJECTS COME FROM KNOWN LOCATIONS AND/OR STATES (E.G. THE SNAKE IS KNOWN TO
	 * HAVE BEEN DESTROYED AND NEEDN'T BE CARRIED AWAY FROM ITS OLD "PLACE"),
	 * MAKING THE VARIOUS OBJECTS BE HANDLED DIFFERENTLY.  WE ALSO DROP ALL OTHER
	 * OBJECTS HE MIGHT BE CARRYING (LEST HE HAVE SOME WHICH COULD CAUSE TROUBLE,
	 * SUCH AS THE KEYS).  WE DESCRIBE THE FLASH OF LIGHT AND TRUNDLE BACK.
	 */
	_setupStorageRoom: function() {
		// Label 11000
		this.setProp(this.bottle, this.put(this.bottle, 115, 1));
		this.setProp(this.plant, this.put(this.plant, 115, 0));
		this.setProp(this.oyster, this.put(this.oyster, 115, 0));
		this.setProp(this.lamp, this.put(this.lamp, 115, 0));
		this.setProp(this.rod, this.put(this.rod, 115, 0));
		this.setProp(this.dwarf, this.put(this.dwarf, 115, 0));
		this.loc = 115;
		this.oldloc = 115;
		this.newloc = 115;

		// LEAVE THE GRATE WITH NORMAL (NON-NEGATIVE PROPERTY).

		this.put(this.grate, 116, 0);
		this.setProp(this.snake, this.put(this.snake, 116, 1));
		this.setProp(this.bird, this.put(this.bird, 116, 1));
		this.setProp(this.cage, this.put(this.cage, 116, 0));
		this.setProp(this.rod2, this.put(this.rod2, 116, 0));
		this.setProp(this.pillow, this.put(this.pillow, 116, 0));

		this.setProp(this.mirror, this.put(this.mirror, 115, 0));
		this.fixed[this.mirror-1] = 116;

		for (var i = 1; i <= 100; i++) {
			if (this.toting(i)) {
				this.destroy(i);
			}
		}

		this.rspeak(132);
		this.closed = true;
		return this._nextTurn();
	},
	/**
	 * OH DEAR, HE'S DISTURBED THE DWARVES.
	 */
	_disturbDwarves: function() {
		// Label 19000
		this.rspeak(136);
		this._endGame();
	},
	/**
	 * Calculate the current score. NOTE: In the original, this would also
	 * end the game is "SCORNG" was true. In this version, it JUST prints the
	 * scoring method and ends. Use _endGame() to end the game.
	 *
	 * THE PRESENT SCORING ALGORITHM IS AS FOLLOWS:
	 *    OBJECTIVE:          POINTS:        PRESENT TOTAL POSSIBLE:
	 * GETTING WELL INTO CAVE   25                    25
	 * EACH TREASURE < CHEST    12                    60
	 * TREASURE CHEST ITSELF    14                    14
	 * EACH TREASURE > CHEST    16                   144
	 * SURVIVING             (MAX-NUM)*10             30
	 * NOT QUITTING              4                     4
	 * REACHING "CLOSNG"        25                    25
	 * "CLOSED": QUIT/KILLED    10
	 *           KLUTZED        25
	 *           WRONG WAY      30
	 *           SUCCESS        45                    45
	 * CAME TO WITT'S END        1                     1
	 * ROUND OUT THE TOTAL       2                     2
	 *                                      TOTAL:   350
	 * (POINTS CAN ALSO BE DEDUCTED FOR USING HINTS.)
	 */
	_score: function(scoring) {
		// Label 20000
		var score = 0;
		var maxScore = 0;

		/*
		 * FIRST TALLY UP THE TREASURES.  MUST BE IN BUILDING AND NOT BROKEN.
		 * GIVE THE POOR GUY 2 POINTS JUST FOR FINDING EACH TREASURE.
		 */

		for (var i = 50; i <= this.maxtrs; i++) {
			if (logging.PTEXT[i-1] != null) {
				var k = 12;
				if (i == this.chest) {
					k = 14;
				}
				if (i > this.chest) {
					k = 16;
				}
				if (this.prop(i) >= 0) {
					score = score+2;
				}
				if (this.place[i-1] == 3 && this.prop(i) == 0) {
					score = score+k-2;
				}
				maxScore += k;
			}
		}
		/*
		 * NOW LOOK AT HOW HE FINISHED AND HOW FAR HE GOT.  MAXDIE AND NUMDIE TELL US
		 * HOW WELL HE SURVIVED.  GAVEUP SAYS WHETHER HE EXITED VIA QUIT.  DFLAG WILL
		 * TELL US IF HE EVER GOT SUITABLY DEEP INTO THE CAVE.  CLOSNG STILL INDICATES
		 * WHETHER HE REACHED THE ENDGAME.  AND IF HE GOT AS FAR AS "CAVE CLOSED"
		 * (INDICATED BY "CLOSED"), THEN BONUS IS ZERO FOR MUNDANE EXITS OR 133, 134,
		 * 135 IF HE BLEW IT (SO TO SPEAK).
		 */
		score += (this.maxdie - this.numdie) * 10;
		maxScore += this.maxdie * 10;
		if (!(scoring || this.gaveup)) {
			score += 4;
		}
		maxScore += 4;
		if (this.dflag != 0) {
			score += 25;
		}
		maxScore += 25;
		if (this.closng) {
			score += 25;
		}
		maxScore += 25;
		if (this.closed) {
			switch (this.bonus) {
			case 0:
				score += 10;
				break;
			case 135:
				score += 25;
				break;
			case 134:
				score += 30;
				break;
			case 133:
				score += 45;
				break;
			}
		}
		maxScore += 45;

		// DID HE COME TO WITT'S END AS HE SHOULD?

		if (this.place[this.magzin-1] == 180) {
			score++;
		}
		maxScore++;

		// ROUND IT OFF.

		score += 2;
		maxScore += 2;

		// DEDUCT POINTS FOR HINTS.  HINTS < 4 ARE SPECIAL; SEE DATABASE DESCRIPTION.

		for (var i = 0; i < this.hinted.length; i++) {
			if (this.hinted[i]) {
				score -= logging.HINTS[i][1];
			}
		}

		if (arguments.length == 0) {
			// Don't print anything if we're called with no arguments.
			return score;
		}

		// THAT SHOULD BE GOOD ENOUGH.  LET'S TELL HIM ALL ABOUT IT.
		if (scoring) {
			this.println('If you were to quit now, you would score ', score,
				' out of a possible ', maxScore, '.');
		} else {
			this.println('You scored ', score, ' out of a possible ', maxScore,
				', using ', this.turns,' turns.');
		}
		return score;
	},
	/**
	 * Ends the game - prints the score.
	 */
	_endGame: function() {
		// Label 20000 when SCORNG is .FALSE.
		var score = this._score(false);
		var rank;
		for (rank = 0; rank < logging.RANKS.length; rank++) {
			if (logging.RANKS[rank].score >= score)
				break;
		}
		if (rank >= logging.RANKS.length) {
			this.println("You just went off my scale!!");
		} else {
			this.speak(logging.RANKS[rank].message+"\n");
			if (rank + 1 < logging.RANKS.length) {
				var k = logging.RANKS[rank].score+1-score;
				this.println("To achieve the next higher rating, you need ",
					k, " more point", k == 1 ? "." : "s.");
			} else {
				this.println('To achieve the next higher rating would be a neat trick!\n Congratulations!!');
			}
		}
		this._stopped = true;
		return;
	},
	/**
	 * Prints the given message, which is a string and NOT a pointer into the
	 * lines array, which doesn't exist in this version.
	 */
	speak: function(msg) {
		if (msg == null || msg == '>$<')
			return;
		if (this.blklin) {
			this.println();
		}
		this.println(msg);
	},
	/**
	 * Prints the "skip"th message from the ptext array.
	 */
	pspeak: function(msg, skip) {
		this.speak(logging.PTEXT[msg-1][skip+1]);
	},
	/**
	 * PRINT THE I-TH "RANDOM" MESSAGE (SECTION 6 OF DATABASE).
	 */
	rspeak: function(i) {
		this.speak(logging.RTEXT[i-1]);
	},
	getin: function(callback) {
		if (this.blklin) {
			this.println();
		}
		this._callback = callback;
	},
	/**
	 * CALL YESX (BELOW) WITH MESSAGES FROM SECTION 6.
	 */
	yes: function(prompt, ifYes, ifNo, callback) {
		this.yesx(prompt, ifYes, ifNo, this.rspeak, callback);
	},
	yesx: function(prompt, ifYes, ifNo, spk, callback) {
		if (prompt != null && prompt != 0)
			spk.call(this, prompt);
		if (typeof callback != 'function') {
			throw Error("Missing callback for yesx");
		}
		// Closure time!
		var self = this;
		cb = function(m) {
			m = m.toUpperCase();
			if (m == "YES" || m == "Y") {
				if (ifYes != null && ifYes != 0)
					spk.call(self, ifYes);
				callback.call(self, true);
			} else if (m == "NO" || m == "N") {
				if (ifNo != null && ifNo != 0) {
					spk.call(self, ifNo);
				}
				callback.call(self, false);
			} else {
				self.println("Please answer the question.\n");
				self.getin(cb);
			}
		};
		this.getin(cb);
	},
	/**
	 * Vocab lookup. This is done via a JavaScript hash table rather than using
	 * the original hash table code, since the original hash table code relies on
	 * the way the PDP-11 worked.
	 * @param {string} word the word to look up
	 * @param {number} init called "init" in the original, this appears to be more
	 * or less the "section" to look it up in - when it's >= 0, it's an error
	 * for the word to be missing
	 */
	vocab: function(word, init) {
		// always do upper-case
		word = word.toUpperCase();
		if (word.length > 5)
			word = word.substr(0, 5);
		if (init < 0) {
			// Search all sections
			for (var i = 0; i < logging.VOCAB.length; i++) {
				var m = logging.VOCAB[i][word];
				if (m)
					return m;
			}
			return -1;
		} else {
			if (init >= logging.VOCAB.length) {
				throw Error("Bad init value " + init);
			}
			var m = logging.VOCAB[init][word];
			if (!m)
				throw Error("Missing required word " + word + " (I think)");
			return m ? (m%1000) : -1;
		}
	},
	/**
	 * Permanently eliminate "object" by moving to a non-existent location.
	 */
	destroy: function(object) {
		this.move(object, 0);
	},

	/**
	 * Juggle an object by picking it up and putting it down again, the
	 * purpose being to get the object to the front of the chain of things at
	 * its loc.
	 */
	juggle: function(object) {
		var i = this.place[object-1];
		var j = this.fixed[object-1];
		this.move(object, i);
		this.move(object+100, j);
	},

	/**
	 * Place any object anywhere by picking it up and dropping it. May already
	 * be toting, in which case the carry is a no-op. Mustn't pick up objects
	 * which are not at any loc, since carry wants to remove objects from atloc
	 * chains.
	 */
	move: function(object, where) {
		var from;
		if (object > 100) {
			from = this.fixed[object-101];
		} else {
			from = this.place[object-1];
		}
		if (from > 0 && from <= 300) {
			this.carry(object, from);
			this.drop(object, where);
		}
	},
	/**
	 * PUT IS THE SAME AS MOVE, EXCEPT IT RETURNS A VALUE USED TO SET UP THE
	 * NEGATED PROP VALUES FOR THE REPOSITORY OBJECTS.
	 */
	put: function(object, where, pval) {
		this.move(object, where);
		return (-1) - pval;
	},
	/**
	 * Start toting an object, removing it from the list of things at its
	 * former location. Incr holdng unless it was already being toted. If
	 * object>100 (moving "fixed" second loc), don't change place or holdng.
	 */
	carry: function(object, where) {
		if (object <= 100) {
			if (this.place[object-1] == -1) {
				return;
			}
			this.place[object-1] = -1;
			this.holdng++;
		}
		if (this.atloc[where-1] == object) {
			this.atloc[where-1] = this.link[object-1];
			return;
		}
		temp = this.atloc[where-1];
		while (this.link[temp-1] != object) {
			temp = this.link[temp-1];
		}
		this.link[temp-1] = this.link[object-1];
		return;
	},

	/**
	 * Place an object at a given location, prefixing it onto the atloc list.
	 * Decrease holdng if the object was being toted.
	 */
	drop: function(object, where) {
		if (object <= 100) {
			if (this.place[object - 1] == -1) {
				this.holdng--;
			}
			this.place[object-1] = where;
		} else {
			this.fixed[object-101] = where;
		}
		if (where > 0) {
			this.link[object-1] = this.atloc[where-1];
			this.atloc[where-1] = object;
		}
	},
	motd: function() {
		if (logging['MOTD']) {
			this.println(logging['MOTD']);
		}
	},

	/* UTILITY ROUTINES (SHIFT, RAN, DATIME, CIAO, BUG) */

	/**
	 * Handles shift in the way that ADVENT expects - basically, this only adds
	 * support for shifting negative values.
	 */
	shift: function(val, dist) {
		return dist < 0 ? val << dist : val >> (-dist);
	},
/*
	This really doesn't seem to work. Not sure if it's because I ported it
	wrong (most likely) or if it's just "a real lose", but let's just stick
	with the JavaScript built-in random for now.
	/ **
	 * R value for the ran() function.
	 * @type {number}
	 * /
	_ran_r: 0,
	/ **
	 * D value for the ran() function.
	 * @type {number}
	 * /
	_ran_d: 0,
	ran: function(range) {
		if (this._ran_r == 0) {
			var now = new Date();
			this._ran_r = 18 * (now.getHours() * 60 + now.getMinutes());
			// Days since 1977-01-01
			// First get days since 1970-01-01 via getTime(),
			// then subtract the number of days between 1970-01-01 and
			// 1977-01-01, remembering that there were two leap years.
			this._ran_d = Math.floor(now.getTime() / (24*60*60*1000)) - (7 * 365 + 2);
			this._ran_d = 1000 + (this._ran_d % 1000);
		}
		// I'm practically positive this is how the ran method works in advent.for,
		// although it seems horrible ineffecient.
		for (var t = 1; t <= this._ran_d; t++) {
			this._ran_r = (this._ran_r * 1021) % 1048576;
		}
		return Math.floor(range * this._ran_r / 1048576);
	},
*/
	ran: function(range) {
		return Math.floor(Math.random()*range);
	},

	_dbBugMessages: [
		'MESSAGE LINE > 70 CHARACTERS',
		'NULL LINE IN MESSAGE',
		'TOO MANY WORDS OF MESSAGES',
		'TOO MANY TRAVEL OPTIONS',
		'TOO MANY VOCABULARY WORDS',
		'REQUIRED VOCABULARY WORD NOT FOUND',
		'TOO MANY RTEXT OR MTEXT MESSAGES',
		'TOO MANY HINTS',
		'LOCATION HAS COND BIT BEING SET TWICE',
		'INVALID SECTION NUMBER IN DATABASE'
	],
	_rtBugMessages: [
		'SPECIAL TRAVEL (500>L>300) EXCEEDS GOTO LIST',
		'RAN OFF END OF VOCABULARY TABLE',
		'VOCABULARY TYPE (N/1000) NOT BETWEEN 0 AND 3',
		'INTRANSITIVE ACTION VERB EXCEEDS GOTO LIST',
		'TRANSITIVE ACTION VERB EXCEEDS GOTO LIST',
		'CONDITIONAL TRAVEL ENTRY WITH NO ALTERNATIVE',
		'LOCATION HAS NO TRAVEL ENTRIES',
		'HINT NUMBER EXCEEDS GOTO LIST',
		'INVALID MONTH RETURNED BY DATE FUNCTION'
	],
	/**
	 * Throws an exception based on the original error codes.
	 */
	bug: function(num) {
		var m;
		if (num >= 0 && num < this._dbBugMessages.length) {
			m = this._dbBugMessages[num];
		} else if (num >= 20 && num < (this._rtBugMessages.length+20)) {
			m = this._rtBugMessages[num-20];
		} else {
			m = "Invalid error number " + num;
		}
		throw Error('Fatal error: ' + m);
	}
};
