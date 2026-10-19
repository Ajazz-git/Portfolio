/* Packet's little brain: no server, no AI service. Typo-tolerant intent matching, a small knowledge base about the site,
   a glossary, tiny games, memory of your name, and moods. window.PacketBrain.think(text, env) -> { t, m, a, d, o, acts } */
(function () {
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var put = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var st = { last: '', prev: '', mode: '', data: null, offer: '', fb: 0, seen: {}, lastIn: '', turns: 0, more: null };

  var JOKES = ["Why did the router go to therapy? Too many connection issues.", "There are 10 kinds of people: those who know binary and those who don't.", "It's not DNS. There's no way it's DNS. ...It was DNS.", "A SQL query walks into a bar, sees two tables and asks: can I join you?", "I would tell you a UDP joke, but you might not get it.", "Why do penguins love firewalls? They keep things cool and block the cold calls.", "How does a penguin build its house? Igloos it together.", "Why was the laptop cold? It left its Windows open."];
  var FACTS = ["Penguins propose with a pebble. I'm saving up for a very good pebble.", "The first computer 'bug' was a real moth, found in a machine in 1947.", "Linux's mascot is a penguin called Tux. Distant cousin, I'm told.", "The first message sent on the internet's ancestor was meant to be 'LOGIN'. It crashed after 'LO'.", "Emperor penguins can dive deeper than 500 metres. I can barely dive into a spreadsheet.", "About 90% of IT problems are fixed by 'did you restart it?' The other 10% are DNS.", "A group of penguins in the water is a raft. On land it's a waddle. 🐧", "The '@' sign was picked for email in 1971 because it was never used in names."];
  var RIDDLES = [["I have keys but open no doors, space but no room, and you can enter but never leave. What am I?", /keyboard/], ["The more of me there is, the less you see. What am I?", /dark/], ["I'm full of holes but still hold water. What am I?", /sponge/], ["What has a head and a tail but no body?", /coin/], ["What goes up when the rain comes down?", /umbrella/]];
  var GLOSS = {
    dns: "DNS is the internet's phone book. It turns names like example.com into the numbers computers actually use.",
    dhcp: "DHCP hands out IP addresses automatically when a device joins the network. Like a front desk giving out room keys.",
    vpn: "A VPN makes a private, encrypted tunnel across the public internet, so you can reach work stuff safely from anywhere.",
    firewall: "A firewall checks every packet at the door and decides who gets in. I am a packet. I get checked a lot.",
    ip: "An IP address is a device's address on a network, so data knows where to go.",
    router: "A router connects networks together and points traffic the right way. The traffic cop of the building.",
    switch: "A switch connects devices inside one network and passes data only where it needs to go.",
    ping: "Ping sends a tiny 'are you there?' to another machine and times the reply. Ping... pong!",
    latency: "Latency is the delay between sending something and it arriving. Low is good. Gamers cry about it.",
    bandwidth: "Bandwidth is how much data can flow at once. Think of it as the width of the pipe.",
    backup: "A backup is a spare copy of your data stored somewhere else. If you only have one copy, you have none.",
    phishing: "Phishing is a fake message that tricks you into giving up a password or clicking a bad link. Pause before you click.",
    mfa: "MFA (or 2FA) asks for a second proof, like a code on your phone, so a stolen password alone isn't enough.",
    ssh: "SSH is a secure way to control another computer from a text terminal.",
    ram: "RAM is a computer's short-term memory: fast, but it forgets everything when the power goes off.",
    ssd: "An SSD stores your files on fast flash chips, with no spinning parts. Much quicker than an old hard disk.",
    cloud: "The cloud is just other people's computers, rented by the hour, in big data centres.",
    vlan: "A VLAN splits one physical network into separate virtual ones, so guests and staff don't share the same space.",
    subnet: "A subnet is a smaller slice of a bigger network, so it's easier to organise and secure.",
    port: "A port is a numbered door on a computer. Web traffic knocks on 443, mail on others.",
    packet: "A packet is a small chunk of data travelling across a network. That's me! Well, I'm a penguin. But spiritually.",
    cache: "A cache keeps a copy of something you use a lot, close by, so it loads faster next time.",
    server: "A server is a computer whose job is to serve things to others: websites, files, mail, logins.",
    endpoint: "An endpoint is any device people actually use: laptops, phones, desktops. The things that get spilled coffee on.",
    malware: "Malware is software built to do harm: steal data, spy, lock files, or just cause chaos.",
    ransomware: "Ransomware locks your files and demands money. The best defence is good backups and careful clicking.",
    uptime: "Uptime is how long a system has been running without going down. Sysadmins treasure it.",
    sysadmin: "A sysadmin keeps servers, networks, devices and accounts running. Ajas does that. I mostly supervise.",
    ticket: "A ticket is a logged request or problem in the help desk, so nothing gets forgotten.",
    bug: "A bug is a mistake in software. The word comes from an actual moth found in a computer in 1947.",
    linux: "Linux is a free operating system that runs most of the world's servers. Its mascot is a penguin. Respect.",
    encryption: "Encryption scrambles data so only someone with the right key can read it."
  };
  var GALIAS = { 'ip address': 'ip', '2fa': 'mfa', 'two factor': 'mfa', 'multi factor': 'mfa', 'wi fi': '', 'a record': 'dns', 'domain': 'dns', 'help desk': 'ticket', helpdesk: 'ticket', 'sys admin': 'sysadmin', 'system administrator': 'sysadmin', 'hard drive': 'ssd', 'memory': 'ram', 'viruses': 'malware', 'virus': 'malware', 'encrypt': 'encryption', 'vlans': 'vlan', 'dns server': 'dns' };
  var FIXES = [
    [/wi ?fi|wifi|internet|slow net|network (is )?slow|no connection|disconnect/, "Slow Wi-Fi? Move closer, restart the router (30 seconds off), and check if it's every device or just yours. If it's one corner of the building, it's usually coverage, not the plan.", 'The Fix it game has a slow Wi-Fi case. Want to try it?'],
    [/printer|print/, "Printer playing dead? Clear the stuck jobs from the queue, restart the print service, and check the printer still has the same address. It's rarely the printer, except when it is.", 'There is a printer case in Fix it too.'],
    [/forgot.*pass|password|locked out|can.?t log ?in|cannot log ?in|account lock/, "Locked out? Check if the account is actually locked, ask what changed (a phone with an old saved password is the classic culprit), then reset with a proper verification.", 'Fix it has a lockout case. Test your instincts?'],
    [/vpn/, "VPN not connecting? Check the internet works first, then the app is up to date, then try another network. If it fails everywhere, the account or certificate may be the problem.", 'Fix it has a VPN case.'],
    [/laptop|computer|pc|slow (machine|computer)|freez|hang|crash/, "Slow computer? Restart it (really), check what's eating memory and startup, free some disk space, and see if updates are stuck waiting.", 'Fix it has a slow laptop case.'],
    [/phish|suspicious (mail|email|link)|clicked (a )?link|scam/, "If you clicked something odd: don't panic. Change that password now, sign out other sessions, turn on MFA, and tell your IT person. Speed matters more than guilt.", 'Fix it has a phishing case.'],
    [/hack|breach|stolen account|virus|malware|ransom/, "Think you're hacked? Disconnect from the network, change passwords from a clean device, turn on MFA, and tell IT. Don't pay anyone yet.", 'The phishing case in Fix it walks through this.'],
    [/backup|lost (a )?file|deleted|recover/, "Lost a file? Check the recycle bin and previous versions first. Going forward: three copies, two kinds of storage, one off-site. Boring, and it saves lives.", '']
  ];
  var PAGES = { about: 'about', experience: 'experience', skills: 'skills', roadmap: 'roadmap', 'fix it': 'fixit', fixit: 'fixit', lab: 'lab', 'network lab': 'lab', docs: 'docs', documentation: 'docs', resume: 'resume', contact: 'contact', home: 'home', top: 'home', 'packet park': 'fixit' };
  var BADN = /^(fine|good|great|ok|okay|sad|tired|happy|bored|hungry|here|back|sorry|angry|cool|new|just|not|so|very|a|an|the|looking|wondering|curious|interested|also|testing|in|from|going|trying|still|really|sure|doing|well|glad|excited|stuck|confused|lost|busy|late|early|ready|done|worried|scared|stressed|sick|ill|alone|lonely|nervous)$/;

  /* typo tolerance: snap unknown words to the nearest word the brain knows */
  var VOCAB = ('whats thats hows wheres whos tell show your mine dont cant hello thanks thank resume contact experience skills skill joke funny penguin packet weather firewall network password printer laptop internet server backup security phishing cloud tetris game fish hungry sleep tired happy bored angry stupid love email location where what why how when time date today available about tour around show lab roadmap docs documentation terminal wifi connect slow router explain define meaning favourite favorite color colour food music sing dance story riddle fact hug cute smart robot human real alive hire salary experience education certificate project projects ajas ajaz kochi kerala india').split(' ');
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 1; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function fix(w) {
    if (w.length < 3 || VOCAB.indexOf(w) >= 0 || /\d/.test(w)) return w;
    var best = w, bd = w.length >= 8 ? 2 : 1, i;
    if (w.length === 3 && !/^(jok|tel|hel|hii)$/.test(w)) return w;
    for (i = 0; i < VOCAB.length; i++) { if (VOCAB[i].charAt(0) !== w.charAt(0) || VOCAB[i].length < 4) continue; var d = lev(w, VOCAB[i]); if (d < bd || (d === bd && best === w)) { if (d <= bd) { best = VOCAB[i]; bd = d; } } }
    return best;
  }
  function norm(raw) {
    var t = raw.toLowerCase().replace(/’/g, "'").replace(/\bplus\b/g, '+').replace(/\bminus\b/g, '-').replace(/\b(times|multiplied by)\b/g, '*').replace(/\bdivided by\b/g, '/');
    t = t.replace(/[^a-z0-9+\-*/.' ?!]/g, ' ').replace(/\s+/g, ' ').trim();
    return t.split(' ').map(fix).join(' ');
  }

  function R(t, m, a, extra) { var o = { t: t, m: m || 'happy', a: a || '' }; if (extra) for (var k in extra) o[k] = extra[k]; return o; }
  function nm(env) { return env.name ? ', ' + env.name : ''; }

  var INTENTS = [
    ['crisis', /kill myself|suicid|end my life|want to die|hurt myself|self harm|don'?t want to live/, function () {
      return R("I'm only a penguin program, but I care. Please talk to someone you trust right now, or call a helpline. In India you can call Tele-MANAS on 14416 (free, any time). You matter. 💙", 'sad', '', { calm: 1 });
    }],
    ['setname', /\b(?:my name is|call me|i am called|name'?s|(?:i'?m|im|i am)) ([a-z]{2,15})\b/, function (env, m) {
      var n = m[1]; if (BADN.test(n) || /(ing|ed|ly)$/.test(n)) return null;
      n = n.charAt(0).toUpperCase() + n.slice(1); put('pk-name', n); env.name = n;
      return R(pick(['Nice to meet you, ' + n + '! Good name. Very trustworthy. 🐧', n + '! Got it. I never forget a name, only fish. 🐟', 'Hi ' + n + '! Packet, at your service.']), 'smug', 'smirk');
    }],
    ['myname', /what'?s my name|do you know me|who am i|remember me|do you remember/, function (env) {
      var v = parseInt(get('pk-visits'), 10) || 1;
      return env.name ? R('You are ' + env.name + '! And this is visit #' + v + '. I remember. 🐧', 'love', 'smirk') : R("Hmm, you haven't told me yet! What should I call you? (Say \"my name is ...\")", 'curious', 'think');
    }],
    ['greet', /^(hi+|hello+|hey+|yo|hola|namaste|sup|howdy|good (morning|afternoon|evening|night))\b/, function (env) {
      var h = new Date().getHours(), p = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      return R(pick(['Well, well. A visitor' + nm(env) + '. 🐧', p + nm(env) + '. Please don\'t touch the red cables.', 'Oh, you\'re here. I was just about to do something naughty.', 'Ping received. State your business' + nm(env) + '.']), 'smug', 'smirk');
    }],
    ['howru', /how are you|how r u|how'?s it going|how do you do|you ok|what'?s up|wassup|how'?s life/, function () {
      return R(pick(["Living rent-free in your browser. You?", "Zero packet loss, maximum attitude. You?", "Great. I just rerouted somebody's lunch break. Don't ask.", "Hungry, but dangerous. How are you?"]), 'smug', 'smirk');
    }],
    ['whoami', /who are you|your name|what are you|are you (a )?(penguin|bird)|tell me about (yourself|you)\b|introduce yourself/, function () {
      return R("I'm Packet, a penguin who lives in this network. I carry data around, supervise the site and judge people's cable management. 🐧", 'happy', 'smirk', { more: "I wear goggles because the rocket is fast, and a scarf because the data centre is cold." });
    }],
    ['real', /are you (real|human|ai|a bot|a robot|alive|chatgpt|claude|a person)|real person|are you smart|are you intelligent/, function () {
      return R("I'm a small program living in this page. No cloud AI here: just Ajas's code, a nose for keywords and a deep love of fish. I try to understand, and I'm honest when I don't. 🐟", 'wink', 'nod', { more: "If I can't answer, I'll pass your question to Ajas himself. He's the real person." });
    }],
    ['maker', /who (made|built|created|coded|designed|programmed) (you|this|the site|it)|your (creator|maker|dad|owner)/, function () {
      return R("Ajas made me! He's the IT specialist behind this whole site. I just fly around and do the supervising. 🐧", 'happy', 'nod', { o: 'about' });
    }],
    ['age', /how old are you|your age|when were you (born|made|hatched)/, function () {
      return R("I hatched in a data centre not long ago. In penguin years? Very young. In router years? Ancient.", 'wink', 'smirk');
    }],
    ['likes', /favou?rite (food|color|colour|animal|song|movie|game|protocol|language|thing)|what do you (eat|like|love|do for fun)|do you like/, function (env, m, n) {
      if (/color|colour/.test(n)) return R("Green! Obviously. It's right there on my cap. And on every terminal ever.", 'happy', 'smirk');
      if (/food|eat/.test(n)) return R("Fish. Always fish. Salmon on Sundays. 🐟", 'love', 'smirk');
      if (/protocol/.test(n)) return R("UDP. It never waits for anyone, which is relatable.", 'smug', 'smirk');
      if (/language/.test(n)) return R("Python for scripting, but I mostly speak fluent waddle.", 'wink', '');
      if (/game/.test(n)) return R("Tetris. I'm a packet. Falling blocks are my love language. Try it!", 'happy', 'dance', { o: 'game' });
      return R("Fish, rockets, tidy cables and people who say thank you. 🐟", 'happy', 'smirk');
    }],
    ['fly', /can you fly|rocket|jet ?pack|goggles|scarf|how do you fly/, function () {
      return R("Penguins can't fly, so I borrowed a rocket. The goggles are for speed, the scarf is for style. Don't tell the other penguins. 🚀", 'happy', 'dance');
    }],
    ['sleepP', /do you sleep|are you (tired|sleepy)|where do you (live|sleep)/, function () {
      return R("I live in the network closet. I nap when nobody's around, so don't leave me alone too long. 💤", 'sleepy', 'nod');
    }],
    ['feelsad', /\b(i'?m|im|i am|i feel|feeling|i was) (so |really |very |a bit |kinda )?(sad|down|depressed|lonely|upset|anxious|worried|stressed|overwhelmed|miserable|not ok|not okay)|bad day|rough day|crying/, function () {
      return R(pick(["Aww. That sounds heavy. I'm right here. Want a joke, a fish fact, or just to tell me about it?", "Sorry you're having a rough time. A tiny penguin hug is on the way. 🤗 Want to talk, or want a distraction?"]), 'sad', 'hug', { acts: 'cheer' });
    }],
    ['feelhappy', /\b(i'?m|im|i am|i feel|feeling) (so |really |very )?(happy|great|good|awesome|excited|amazing|fantastic|wonderful|fine|better)\b/, function () {
      return R(pick(["Yay! Happy human, happy penguin! 🎉", "That's wonderful to hear! now I'm happy too.", "Love that. Want to celebrate with a Tetris round?"]), 'happy', 'dance');
    }],
    ['bored', /\b(i'?m|im|i am) bored|so bored|nothing to do|entertain me/, function () {
      return R("Bored? Not on my watch! Try the tour, a round of Tetris in the terminal, the Network lab, or just feed me. 🐟", 'happy', 'dance', { acts: 'fun' });
    }],
    ['tiredU', /\b(i'?m|im|i am) (so |really |very )?(tired|sleepy|exhausted|sleep deprived)/, function () {
      return R("Rest is a legit fix. Even servers get maintenance windows. 💤 Drink some water and take a break?", 'sleepy', 'nod');
    }],
    ['hungryU', /\b(i'?m|im|i am) (so |really |very )?(hungry|starving)|i want food|i need food/, function () {
      return R("Go eat something! I'd recommend fish, but I'm biased. 🐟 Come back when you're full.", 'happy', 'smirk');
    }],
    ['angryU', /\b(i'?m|im|i am) (so |really |very )?(angry|mad|furious|annoyed|frustrated)|i hate (this|my|it)/, function () {
      return R("Deep breath. In... out. Tech does that to everyone. Want to tell me what broke? I know a few tricks.", 'sad', 'nod');
    }],
    ['love', /i love you|love you|i like you|you(?:'re| are| r|r the| the)? (so |very )?(cute|adorable|sweet|the best|awesome|cool|amazing|smart|clever|funny|great)|cutie|good (boy|penguin|job|bird)|marry me|be my (friend|bff)/, function (env) {
      return R(pick(["I know, I know. I'm very likeable. 😎", "Smooth talker. Keep going, I'm taking notes.", "Flattery works. Fish works better. 🐟", "Aw— I mean. Obviously. 😏"]), 'smug', 'smirk');
    }],
    ['insult', /\b(stupid|dumb|ugly|idiot|useless|worst|shut up|annoying|you suck|hate you|trash|boring)\b/, function () {
      return R(pick(["Bold words from someone who talks to a penguin. 😏", "Ouch. Noted. I've added that to your file.", "Wow. I'm telling the router. It has your IP."]), 'sly', 'smirk');
    }],
    ['thanks', /thank|thx|appreciate|cheers/, function () {
      return R(pick(["Don't mention it. Seriously. My ego is full.", "Anytime. I'm very helpful when I feel like it. 😏", "You're welcome. Fish donations accepted. 🐟"]), 'smug', 'nod');
    }],
    ['laugh', /\b(lol|lmao|haha+|hehe+|hihi+|rofl)\b|^(😂|🤣)/, function () {
      return R(pick(["Ha! Knew I was funny.", "That's right, laugh. I'm here all week.", "Nailed it. 😎"]), 'smug', 'smirk');
    }],
    ['naughty', /naughty|prank|mischief|be bad|do something (bad|evil|crazy|wild)|cause trouble|troublemaker/, function () {
      return R(pick(["Okay... but you didn't see this. *unplugs one random cable* ...kidding. Or am I? 😈", "I once renamed every printer to 'Why-Fi'. Nobody noticed for a week.", "My favourite prank: telling Ajas 'the server is fine'. Then watching his eye twitch. 😇", "I hid one fish in the firewall rules. Good luck finding it."]), 'sly', 'smirk');
    }],
    ['sudo', /\bsudo\b|root access|hack (you|the site|this)|rm -rf/, function () {
      return R("Nice try. 'ajas is not in the sudoers file. This incident will be reported.' 📝 (I am the one reporting it.)", 'smug', 'smirk');
    }],
    ['joke', /\bjoke|make me laugh|something funny|funny story|cheer me up/, function () {
      return R(pick(JOKES) + '  *ba-dum-tss*', 'smug', 'smirk', { more: pick(JOKES) });
    }],
    ['fact', /fun fact|tell me something|did you know|random fact|interesting|\bfact\b/, function () {
      return R(pick(FACTS), 'curious', 'nod', { more: pick(FACTS) });
    }],
    ['riddle', /riddle|puzzle|brain ?teaser/, function () {
      var i = Math.floor(Math.random() * RIDDLES.length); st.mode = 'riddle'; st.data = i;
      return R(RIDDLES[i][0] + ' (or say "give up")', 'curious', 'think');
    }],
    ['sing', /\bsing\b|song/, function () { return R("🎵 Ping, ping, ping... pong! My packets loss is zero, zero, zero... 🎵 How was that?", 'happy', 'dance'); }],
    ['dance', /\bdance\b|boogie|groove/, function () { return R("Watch this! 💃🐧", 'happy', 'dance'); }],
    ['hug', /\bhug\b|cuddle|high ?five/, function () { return R(pick(["*hug* 🤗 Flipper-squeeze delivered!", "High flipper! ✋🐧"]), 'love', 'hug'); }],
    ['story', /tell me a story|\bstory\b|tale/, function () {
      return R("Once upon a time, a little packet got lost on the way to a server. It asked a router for help, got passed along 11 hops, and arrived 3 milliseconds late. The server said 'you're late'. The packet said 'you wouldn't believe my journey'. The end. 🐧", 'happy', 'nod');
    }],
    ['knock', /knock knock/, function () { st.mode = 'knock'; return R("Who's there?", 'curious', 'nod'); }],
    ['rps', /rock paper|rps|play.*rock/, function () { st.mode = 'rps'; return R("Rock, paper, scissors! Type your pick.", 'happy', 'smirk'); }],
    ['calc', /^(?:what'?s|what is|calc(?:ulate)?|how much is|=)?\s*(-?\d+(?:\.\d+)?)\s*([+\-*/x×])\s*(-?\d+(?:\.\d+)?)\s*\??$/, function (env, m) {
      var a = parseFloat(m[1]), b = parseFloat(m[3]), o = m[2], r;
      r = o === '+' ? a + b : o === '-' ? a - b : o === '/' ? (b === 0 ? NaN : a / b) : a * b;
      if (isNaN(r)) return R("Dividing by zero? That's how you break the internet. Not today. 🙅", 'surprised', 'gasp');
      return R(a + ' ' + o + ' ' + b + ' = ' + (Math.round(r * 1e6) / 1e6) + '. Easy peasy. 🧮', 'happy', 'nod');
    }],
    ['time', /what time|what'?s the time|what is the time|current time|today'?s date|what'?s the date|what day|what date/, function () {
      var d = new Date();
      return R("It's " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' on ' + d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }) + ' where you are. 🕒', 'happy', 'nod');
    }],
    ['weather', /weather|rain|temperature|hot today|cold today/, function () { return R("I live in a router. No windows! Look outside and tell me. 🌦️", 'curious', 'smirk'); }],
    ['theme', /dark mode|light mode|change theme|switch theme|too bright|too dark/, function () { return R("Switching the lights! 💡", 'happy', 'nod', { d: 'theme' }); }],
    ['tour', /\btour\b|show me around|guide me|walk me through|give me a tour/, function () { return R("Yay, a tour! Hold on to your goggles. 🧭", 'happy', 'dance', { d: 'tour' }); }],
    ['game', /tetris|play (a )?game|let'?s play|\bgame\b|arcade/, function () { return R("Game time! 🎮", 'happy', 'dance', { d: 'game' }); }],
    ['feed', /\bfish\b|\bfeed\b|\bsnack\b|\bhungry\b|\bfood\b/, function () { return R("Fish?! Yes please! 🐟", 'love', 'smirk', { d: 'feed' }); }],
    ['where', /where am i|this (part|section|page)|what'?s here|what is here|what am i looking at/, function () { return R('', 'curious', 'nod', { d: 'where' }); }],
    ['goto', /\b(?:show|take|go|open|scroll|jump|bring|navigate)\b.*?\b(about|experience|skills|roadmap|fix ?it|network lab|lab|docs|documentation|resume|contact|home|top|packet park)\b/, function (env, m) {
      var k = m[1].replace(/fix ?it/, 'fix it'), id = PAGES[k] || PAGES[m[1]];
      return id ? R(pick(['On it! 🚀', 'Hold tight, flying there!', 'Following me? Here we go!']), 'happy', 'nod', { d: 'goto:' + id }) : null;
    }],
    ['explainPart', /what'?s (the )?(lab|roadmap|fix ?it|docs|packet park|terminal|network lab)|what is (the )?(lab|roadmap|fix ?it|docs|packet park|terminal|network lab)|tell me about (the )?(lab|roadmap|fix ?it|docs|packet park|terminal)/, function (env, m, n) {
      if (/roadmap/.test(n)) return R("The Roadmap shows how Ajas's skills grow: learning, working, and daily. It's honest about what's new.", 'happy', 'nod', { o: 'goto:roadmap' });
      if (/lab/.test(n)) return R("A little network you can poke! Ping things, cut the main ISP line, launch an attack. It shows how the pieces connect.", 'happy', 'nod', { o: 'goto:lab' });
      if (/fix/.test(n)) return R("Fix it is a help-desk game: real problems, you pick the right move. Wrong calls cost downtime. 😬", 'happy', 'nod', { o: 'goto:fixit' });
      if (/docs/.test(n)) return R("Docs are sample runbooks and checklists: the boring documentation that saves everyone at 2 a.m.", 'happy', 'nod', { o: 'goto:docs' });
      if (/terminal/.test(n)) return R("The terminal on the home page is real-ish! Try help, cat summary.txt, ping, neofetch, or tetris.", 'happy', 'nod', { o: 'goto:home' });
      return R("Packet Park is the playground: Fix it, the Network lab and the Docs. Hands-on stuff! 🐧", 'happy', 'nod');
    }],
    ['ajasWho', /who is (ajas|ajaz|he)|about (ajas|ajaz|him)|tell me about (ajas|ajaz|him)|who'?s ajas|what does (ajas|ajaz|he) do|his job|what is his job/, function () {
      return R("Ajas is an IT specialist and sysadmin in Kochi. He looks after networks, servers, devices and accounts so offices keep running, across Windows, Linux and macOS. Calm under pressure, and he documents everything.", 'happy', 'nod', { more: "Four roles since 2023, from the support desk up to senior admin. Want the full story? Say 'show experience'.", o: 'goto:experience' });
    }],
    ['ajasSkills', /\b(skills?|tech stack|expertise|good at|specialis\w*)\b|what can (he|ajas) do/, function () {
      return R("Daily: systems and servers, networking and firewalls, documentation. Working on: security and identity, endpoints, monitoring, phones/CCTV/attendance. Learning: cloud and AI tools. All on the Skills page.", 'happy', 'nod', { o: 'goto:skills' });
    }],
    ['ajasExp', /experience|work history|where (did|has) (he|ajas) work|career|previous jobs|\bjobs\b|worked at|companies/, function () {
      return R("Four roles since 2023: support desk, an internship on servers, then senior IT admin running IT for two organisations, and now an IT specialist role. Each card on the Experience page opens the full story.", 'happy', 'nod', { o: 'goto:experience' });
    }],
    ['ajasLoc', /where (is|does) (he|ajas)|where are you from|location|\bkochi\b|\bkerala\b|\bindia\b|city/, function () {
      return R("Ajas is based in Kochi, Kerala, India. 🌴 I'm based in a router, but I get around.", 'happy', 'nod');
    }],
    ['hire', /\b(hire|hiring|available|availability|open to work|job offer|opportunit\w*|freelance|salary|rates?|cost|price|recruit\w*)\b|work with (him|ajas)/, function () {
      return R("Great taste! For jobs, availability or pay, the best thing is to ask Ajas directly. Want me to take you to Contact, or open an email for you?", 'happy', 'nod', { offer: 'mail' });
    }],
    ['contact', /\b(contact|e-?mail|linkedin|instagram|socials?)\b|reach (him|ajas)|phone number|call him|message him|get in touch|how (can|do) i (reach|contact)/, function () {
      return R("The Contact section has his email and links. I'll take you there! The phone stays private, though. 📵", 'happy', 'nod', { d: 'goto:contact' });
    }],
    ['resume', /resume|\bcv\b|curriculum/, function () {
      return R("The resume is almost ready, and Ajas is polishing it. The Resume section will show it when it's done. 📄", 'happy', 'nod', { o: 'goto:resume' });
    }],
    ['edu', /education|degree|certif|qualif|college|university|study|studied/, function () {
      return R("I don't have his education details memorised, and I won't make anything up. Better to ask Ajas directly. Want me to open an email?", 'curious', 'think', { offer: 'mail' });
    }],
    ['project', /project|case stud|portfolio|what has he built|achievement/, function () {
      return R("The Experience cards tell the real stories, and Packet Park (Fix it, Network lab, Docs) shows how he thinks. That's the best proof!", 'happy', 'nod', { o: 'goto:experience' });
    }],
    ['help', /^(help|help me|what can you do|what can i ask|options|commands|what do you know)\??$/, function () {
      return R("I can chat about Ajas and his work, explain IT words (try 'what is DNS?'), give quick tech-fix tips, take you on a tour, play games (Tetris, riddles, rock-paper-scissors), tell jokes, and do maths. Or just talk to me! 🐧", 'happy', 'nod');
    }],
    ['bye', /\b(bye|goodbye|see you|see ya|later|gotta go|good night|cya)\b/, function () { return R('', 'happy', 'nod', { d: 'close' }); }],
    ['yesno', /^(yes|yeah|yep|yup|sure|ok(ay)?|please|go ahead|do it|y)\b/, function (env) {
      if (st.offer === 'mail') { st.offer = ''; return R('Opening an email for you. 📧', 'happy', 'nod', { d: 'mail' }); }
      if (st.offer === 'tour') { st.offer = ''; return R('Let\'s go!', 'happy', 'dance', { d: 'tour' }); }
      if (st.offer === 'fix') { st.offer = ''; return R("Let's play! 🎮", 'happy', 'dance', { d: 'goto:fixit' }); }
      return R(pick(['Great! What would you like to know?', 'Okay! Ask me anything, or say "tour".']), 'happy', 'nod');
    }],
    ['no', /^(no+|nope|nah|not really|no thanks|nothing)\b/, function () { st.offer = ''; return R(pick(['No worries! I\'m here if you need me.', 'Okay! No pressure. 🐧']), 'happy', 'nod'); }],
    ['more', /^(more|go on|tell me more|and\??|continue|really|why|how come|explain|elaborate)\??$/, function () {
      if (st.more) { var t = st.more; st.more = null; return R(t, 'happy', 'nod'); }
      return R(pick(["Hmm, ask me something specific and I'll try!", "Ooh, more of what? Give me a hint. 🐧"]), 'curious', 'think');
    }]
  ];

  function glossary(n) {
    var m = /(?:what is|what'?s|whats|explain|define|meaning of|what does|tell me about|what are)\s+(?:an?\s+|the\s+)?([a-z0-9 \-]+?)(?:\s+mean)?\??$/.exec(n);
    var term = m ? m[1].trim() : n.replace(/\?$/, '').trim();
    var keys = Object.keys(GLOSS), k = GALIAS.hasOwnProperty(term) ? GALIAS[term] : term;
    if (GLOSS[k]) return k;
    var w = term.split(' '); for (var i = 0; i < w.length; i++) { var x = GALIAS.hasOwnProperty(w[i]) ? GALIAS[w[i]] : w[i]; if (GLOSS[x] && (m || w.length <= 2)) return x; }
    var s = term.replace(/s$/, ''); if (GLOSS[s]) return s;
    return keys.indexOf(term) >= 0 ? term : '';
  }

  function modeReply(n, raw) {
    if (st.mode === 'riddle') {
      if (n.split(' ').length > 4 && !/give up|don'?t know/.test(n)) { st.mode = ''; return null; }
      var ri = RIDDLES[st.data];
      if (/give up|idk|don'?t know|tell me|no idea/.test(n)) { st.mode = ''; return R("It's... " + ri[1].source.replace(/[^a-z]/g, '') + "! Got you. Want another?", 'smug', 'smirk'); }
      if (ri[1].test(n)) { st.mode = ''; return R("YES! You got it! 🎉 Big brain human.", 'happy', 'dance'); }
      st.tries = (st.tries || 0) + 1; if (st.tries > 3) { st.mode = ''; st.tries = 0; return R("Let's call it a draw! It was '" + ri[1].source.replace(/[^a-z]/g, '') + "'. Want another riddle?", 'smug', 'smirk'); }
      return R(pick(["Not quite! Try again, or say 'give up'.", "Close... or not. Another guess?"]), 'curious', 'think');
    }
    if (st.mode === 'knock') {
      if (st.data === 'w') { st.mode = ''; return R("Okay that was funny. 😆", 'happy', 'laugh'); }
      st.data = 'w'; return R(raw.replace(/\bwho'?s there\??/i, '').trim() ? raw.trim() + ' who? ...Okay I don\'t have the punchline, you win.' : "Penguin who? Penguin-ish! 🐧", 'happy', 'smirk', { reset: 1 });
    }
    if (st.mode === 'rps') {
      var c = /rock/.test(n) ? 0 : /paper/.test(n) ? 1 : /scissor/.test(n) ? 2 : -1;
      if (c < 0) { st.mode = ''; return /stop|quit|enough|exit|no more/.test(n) ? R('Okay, that was fun! 🐧', 'happy', 'nod') : null; }
      var p = Math.floor(Math.random() * 3), nmz = ['rock', 'paper', 'scissors'];
      var res = p === c ? "Tie! We both picked " + nmz[p] + '.' : (c - p + 3) % 3 === 1 ? 'I picked ' + nmz[p] + '. You win! 🎉' : 'I picked ' + nmz[p] + '. I win! 😎';
      return R(res + ' Again?', p === c ? 'curious' : (c - p + 3) % 3 === 1 ? 'sad' : 'smug', p === c ? 'nod' : (c - p + 3) % 3 === 1 ? 'gasp' : 'laugh');
    }
    return null;
  }

  function think(raw, env) {
    env = env || {}; if (!env.name) env.name = get('pk-name') || '';
    raw = String(raw || '').slice(0, 120);
    var n = norm(raw); st.turns++;
    if (!n || !/[a-z0-9]/.test(n)) return R(pick(['Hm?', 'Psst... use words, my translator is tiny.']), 'curious', 'think');
    var r = null, id = '';
    if (n === st.lastIn && !/^(yes|no|more)/.test(n)) { st.lastIn = n; return R(pick(["You said that already. Try something new?", "Déjà vu! Okay, say it a third time and I'll start charging fish. 🐟"]), 'smug', 'smirk'); }
    st.lastIn = n;
    var md = modeReply(n, raw);
    if (md && !/^(bye|goodbye)/.test(n)) { if (md.reset) st.mode = ''; r = md; id = 'mode'; }
    if (!r) {
      for (var i = 0; i < INTENTS.length; i++) {
        var it = INTENTS[i], m = it[1].exec(n);
        if (m) { var out = it[2](env, m, n); if (out) { r = out; id = it[0]; break; } }
      }
    }
    if (!r && /(what is|what'?s|whats|explain|define|meaning|what does|what are|tell me about|^[a-z0-9 \-]{2,18}\??$)/.test(n)) {
      var g = glossary(n); if (g) { r = R(GLOSS[g], 'curious', 'nod', { more: 'Want another? Ask me about DHCP, VLANs, phishing, MFA, or backups.' }); id = 'gloss'; }
    }
    if (!r) {
      for (var j = 0; j < FIXES.length; j++) if (FIXES[j][0].test(n)) { r = R(FIXES[j][1] + (FIXES[j][2] ? ' ' + FIXES[j][2] : ''), 'focus', 'think', FIXES[j][2] ? { offer: 'fix' } : null); id = 'fix'; break; }
    }
    if (!r) {
      st.fb++;
      var q = /\?/.test(raw) || /^(what|why|how|who|when|where|can|do|does|is|are)\b/.test(n);
      id = 'fallback';
      if (q) r = R(pick(["Good question. I'd answer, but I'm paid in fish and this is above my pay grade. Want me to pass it to Ajas?", "Hmm, above my bandwidth. I can forward it to Ajas, the real expert. 📧", "I could bluff. I'd rather ask Ajas than make something up."]), 'sly', 'shrug', { offer: 'mail', mailq: raw });
      else r = R(pick(["Hmm, didn't catch that. Try asking about Ajas, networking, or say 'tour'.", "Interesting. I understood about half of that. Rephrase, or ask me something techy?", "My translator is tiny and my patience is smaller. Say it another way? 😏"]), 'curious', 'shrug');
      if (st.fb >= 2 && !q) r.acts = 'fun';
    } else st.fb = 0;
    if (r.offer) st.offer = r.offer; else if (id !== 'yesno' && id !== 'no') st.offer = r.o && /^goto/.test(r.o) ? '' : st.offer;
    if (r.o) { st.offer = st.offer || ''; }
    st.more = r.more || null;
    if (r.mailq) st.mq = r.mailq;
    r.id = id; st.prev = st.last; st.last = id;
    return r;
  }

  window.PacketBrain = { think: think, name: function () { return get('pk-name') || ''; }, mailq: function () { return st.mq || ''; } };
})();
