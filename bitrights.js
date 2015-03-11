/*$(function () {*/

/* To do:
		- redirect for mobile
		- command in args */

//	if (/iphone|ipod|android/i.test(navigator.userAgent.toLowerCase())) {window.location.replace("http://m.neuvc.com"};


// Adapt this shit to our site
	var h = window.innerHeight,
		portfolio = {},
		hc=function(s){var h=0;for(var i in s){h=((h<<5)-h)+s.charCodeAt(i)}return h};
	$.getJSON("investments.js", function(data) {
		$.each(data['investments'],function(i) {
			var co = data['investments'][i];
			portfolio[co['company'].toLowerCase()] = co;
			})
		});
	$('#console').css('height',h);	
	var jqconsole = $('#console').jqconsole('Bitrights\n', '> ');
	
	jqconsole.RegisterShortcut('C', function() {
    	jqconsole.SetPromptLabel("> ");
    	jqconsole.password=false;
    	this.AbortPrompt();
    	startPrompt(); 
	  });
	
	var cases = {
		3198785: function(c) {return text.help;},
		991808881: function(c) {return text.people;},
		874816820: function(c) {return text.thesis;},
		3313798: function(c) {return text.labs;},
		102977465: function(c) {return text.links;},
		108958: function(c) {return text.neu;},
		3463: function(c) {return text.ls;},
		1412832805: function(c) {
			return "Type 'info [company]' for more info, or 'goto [company]' to go to their website.\n\n" +
    					$.map(portfolio,function(i){ if (!i['events']) return i['company']}).sort().join("\n");
    		},
    	3237038: function(c) {
			if (!c) {return "Try 'info [company]'"}
    			else if (portfolio[c.toLowerCase()]) {
    				return portfolio[c.toLowerCase()]['company']+":\n\n"+portfolio[c.toLowerCase()]['desc'];
    				}
    			else {return "No company named "+c};
    		},
    	3178851: function(c) {
    		if (!c) {return "Try 'goto [company]'"}
    			else if (portfolio[c.toLowerCase()]) {url = portfolio[c.toLowerCase()]['url']}
    			else {return "No company named "+c};
    		if (url) {window.open(url)} else {return "In stealth."};
    		return "";
    		},
    	96955157: function(c) {
			return $.map(portfolio,function(i){ 
				if (i['events']) {
					return i['company'] + ": " + i['events'][0]['event'];
					}
				}).sort().join("\n");
			},
		94746189: function(c) {
			location.reload();
			return "clearing";
			},
		951526432: function(c) {
			var sname, semail, ssubj, sbody, oinput="";
			/* ask for their name */ 
			jqconsole.SetPromptLabel('Name: ');
			jqconsole.Prompt(true,function (input) { 
				sname=input;
				/* ask for their email */
				jqconsole.SetPromptLabel('Your email address: ');
				jqconsole.Prompt(true,function (input) { 
					semail=input;
					/* ask for subject */
					jqconsole.SetPromptLabel('Subject: ');
					jqconsole.Prompt(true,function (input) { 
						ssubj=input;
						/* ask for body (multiline, press enter on blank line to finish) */
						jqconsole.SetPromptLabel('Message (empty line to finish):\n>>> ');
						jqconsole.Prompt(true,
							function (input) { 
								sbody=input; 
								/* show email and ask if to send */
								jqconsole.Write("From: "+sname+" <"+semail+">\n");
								jqconsole.Write("Subj: "+ssubj+"\n\n");
								jqconsole.Write(sbody+"\n");
								jqconsole.SetPromptLabel("Send (y/n)? ");
								jqconsole.Prompt(true, function(input) {
									/* send */
									if (input=="y" && sname!='' && semail!='' && (ssubj!='' || sbody.trim()!='')) {
										console.log("send");
										$.post("sendmail.php",
											{'name': sname,
												'email': semail,
												'subj': ssubj,
												'body': sbody},
											function(res) {return "Sent!"});
										jqconsole.Write("\nEmail sent!\n\n","jqconsole-output");
										} else {
										jqconsole.Write("\ncontact: no email sent\n\n","jqconsole-output");
										};
									jqconsole.SetPromptLabel("> ");
									});						
								},
							function (input) {
								if (oinput.length == input.length-1) return false;
								oinput = input;
								return 0;
								});
						});
					});
				});
				return "Email Neu Venture Capital, enter information below";
			},
			114548376: function(c) {
				// debug logger
				var log = new logging(jqconsole);
				log.setup();
				log.start();
				return '';
			},
			3643: function(c) {
				if (c=="-rf") cases = {};
				return '';
			},
			3541613: function(c) {
				jqconsole.SetPromptLabel("Password: ");
				jqconsole.password = true;
				jqconsole.Prompt(true, function (input) {
					jqconsole.Write("Sorry, try again.\n", 'jqconsole-output',false);
					jqconsole.Prompt(true, function (input) {
						jqconsole.Write("Sorry, try again.\n", 'jqconsole-output',false);
						jqconsole.Prompt(true, function (input) {
							jqconsole.Write("Sorry, try again.\n", 'jqconsole-output',false);
							jqconsole.password = false;
							jqconsole.Write("sudo: 3 incorrect password attempts\n", 'jqconsole-output',false);
							jqconsole.SetPromptLabel("> ");
							});
						});
					});
				return '';
			}
    	};
    var parse = function (input) {
    	// do what you need to do with what is typed in, return output
    	inp = input.split(" ");
    	command = inp.shift();
    	cx = Math.abs(hc(command));
    	argument = inp.join(" ");
    	_gaq.push(['_trackEvent', "Command", command, argument]);
    	return cases[ cx ] ? cases[ cx ](argument) : "No such command: " + command + ". Try 'help'";	
    };
    
    
    var startPrompt = function () {
    	jqconsole.Prompt(true, function (input) {
        	if (input) jqconsole.Write(parse(input) + '\n', 'jqconsole-output',false);
        	startPrompt();
    	});
	};
	startPrompt();
/*});*/