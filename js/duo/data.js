// Мини-тест «Ребёнок и вы» (страница /duo): 10 вопросов родителю о себе → стиль родителя (те же 8 шкал, что у ребёнка)
// → что родитель даёт ребёнку, на что обратить внимание, что нужно ребёнку его типа, что сделать вместе.
// Тексты сразу на четырёх языках в порядке [en, de, fr, ru]; ru открывается только по ссылке ?lang=ru (вычитка владельцем).
// Обращение к родителю без рода (Sie / vous / вы), стиль родителя назван прилагательным, а не существительным.

export const LANGS = ['en', 'de', 'fr', 'ru'];
const NB = ' ';
// Французская типографика: неразрывный пробел перед : ; ? ! и внутри « »
const fr = (s) => s.replace(/« /g, '«' + NB).replace(/ »/g, NB + '»').replace(/ ([:;?!])/g, NB + '$1');
export const pick = (arr, lang) => { const i = LANGS.indexOf(lang); const s = arr[i < 0 ? 0 : i]; return lang === 'fr' ? fr(s) : s; };

// Каждая шкала встречается ровно 5 раз (пары вопросов покрывают все 8 шкал)
export const QUESTIONS = [
  { t: ['A free Saturday is all yours. You would rather:', 'Ein freier Samstag gehört ganz Ihnen. Am liebsten würden Sie:', 'Un samedi libre, rien que pour vous. Vous préférez :', 'Свободная суббота целиком ваша. Вы скорее:'], o: [
    ['builder', ['Fix or build something at home', 'Zu Hause etwas reparieren oder bauen', 'Réparer ou fabriquer quelque chose à la maison', 'Почините или смастерите что-то дома']],
    ['storyteller', ['Meet friends and talk for hours', 'Freunde treffen und stundenlang reden', 'Voir des amis et discuter pendant des heures', 'Встретитесь с друзьями и проговорите несколько часов']],
    ['explorer', ['Go somewhere you have never been', 'An einen Ort fahren, an dem Sie noch nie waren', 'Aller dans un endroit que vous ne connaissez pas', 'Поедете туда, где ещё не были']],
    ['helper', ['Do something nice for the family', 'Der Familie etwas Gutes tun', 'Faire plaisir à la famille', 'Сделаете что-то приятное для семьи']],
  ] },
  { t: ['In your work or daily tasks you most enjoy:', 'Bei der Arbeit oder im Alltag macht Ihnen am meisten Freude:', 'Dans votre travail ou vos tâches quotidiennes, vous aimez surtout :', 'В работе или повседневных делах вам больше всего нравится:'], o: [
    ['inventor', ['Figuring out how to do it smarter', 'Herauszufinden, wie es klüger geht', 'Trouver une façon plus intelligente de faire', 'Придумывать, как сделать умнее']],
    ['artist', ['Making it look and feel right', 'Dass es gut aussieht und sich stimmig anfühlt', 'Soigner l’apparence et l’ambiance', 'Делать так, чтобы было красиво и со вкусом']],
    ['leader', ['Organizing people and making decisions', 'Menschen zu organisieren und zu entscheiden', 'Organiser les gens et décider', 'Организовывать людей и принимать решения']],
    ['mover', ['Being on your feet, not at a desk', 'Auf den Beinen zu sein, nicht am Schreibtisch', 'Être en mouvement, pas derrière un bureau', 'Быть на ногах, а не за столом']],
  ] },
  { t: ['When your child asks “why?”, you usually:', 'Wenn Ihr Kind „Warum?“ fragt, dann:', 'Quand votre enfant demande « pourquoi ? », le plus souvent :', 'Когда ребёнок спрашивает «почему?», вы обычно:'], o: [
    ['builder', ['Show it with your hands', 'Zeigen Sie es mit den Händen', 'Vous le montrez avec vos mains', 'Показываете руками, на деле']],
    ['inventor', ['Look for the real answer together', 'Suchen Sie zusammen die richtige Antwort', 'Vous cherchez ensemble la vraie réponse', 'Ищете настоящий ответ вместе']],
    ['storyteller', ['Tell a story about it', 'Erzählen Sie dazu eine Geschichte', 'Vous racontez une histoire sur le sujet', 'Рассказываете об этом историю']],
    ['artist', ['Draw it or paint a picture in words', 'Zeichnen Sie es oder beschreiben es in Bildern', 'Vous le dessinez ou le décrivez en images', 'Рисуете или описываете образами']],
  ] },
  { t: ['A family trip. Your role is:', 'Ein Familienausflug. Ihre Rolle:', 'Un voyage en famille. Votre rôle :', 'Семейная поездка. Ваша роль:'], o: [
    ['explorer', ['Finding the unusual places', 'Die ungewöhnlichen Orte finden', 'Trouver les endroits insolites', 'Найти необычные места']],
    ['leader', ['Planning the route and the schedule', 'Route und Zeitplan festlegen', 'Prévoir l’itinéraire et le programme', 'Продумать маршрут и расписание']],
    ['helper', ['Making sure everyone is comfortable', 'Dafür sorgen, dass es allen gut geht', 'Veiller au confort de chacun', 'Следить, чтобы всем было удобно']],
    ['mover', ['Packing in as much activity as possible', 'Möglichst viel Bewegung einplanen', 'Caser un maximum d’activités physiques', 'Уместить как можно больше активности']],
  ] },
  { t: ['What recharges you best?', 'Wobei tanken Sie am besten auf?', 'Qu’est-ce qui vous ressource le mieux ?', 'Что лучше всего восстанавливает ваши силы?'], o: [
    ['builder', ['A hands-on project', 'Ein handwerkliches Projekt', 'Un projet manuel', 'Дело, где нужно работать руками']],
    ['artist', ['Music, art, something beautiful', 'Musik, Kunst, etwas Schönes', 'La musique, l’art, quelque chose de beau', 'Музыка, искусство, что-то красивое']],
    ['explorer', ['Nature and new impressions', 'Natur und neue Eindrücke', 'La nature et de nouvelles impressions', 'Природа и новые впечатления']],
    ['mover', ['Sport or a long walk', 'Sport oder ein langer Spaziergang', 'Le sport ou une longue marche', 'Спорт или долгая прогулка']],
  ] },
  { t: ['In a disagreement you tend to:', 'Bei einer Meinungsverschiedenheit neigen Sie dazu:', 'En cas de désaccord, vous avez tendance à :', 'В споре вы склонны:'], o: [
    ['inventor', ['Lay out the logic', 'Die Logik darzulegen', 'Exposer la logique', 'Разложить всё по логике']],
    ['storyteller', ['Talk it through until it is clear', 'So lange zu reden, bis alles klar ist', 'En parler jusqu’à ce que tout soit clair', 'Проговаривать, пока не станет ясно']],
    ['leader', ['Make the decision', 'Die Entscheidung zu treffen', 'Prendre la décision', 'Принять решение']],
    ['helper', ['Look for a compromise', 'Einen Kompromiss zu suchen', 'Chercher un compromis', 'Искать компромисс']],
  ] },
  { t: ['What do you most want to teach your child?', 'Was möchten Sie Ihrem Kind vor allem beibringen?', 'Que voulez-vous surtout apprendre à votre enfant ?', 'Чему вы больше всего хотите научить ребёнка?'], o: [
    ['builder', ['To finish what they start', 'Angefangenes zu Ende zu bringen', 'À finir ce qui est commencé', 'Доводить начатое до конца']],
    ['inventor', ['To think for themselves', 'Selbst zu denken', 'À penser par soi-même', 'Думать своей головой']],
    ['leader', ['To take responsibility', 'Verantwortung zu übernehmen', 'À prendre ses responsabilités', 'Брать на себя ответственность']],
    ['mover', ['To be strong and healthy', 'Stark und gesund zu sein', 'À être en forme et en bonne santé', 'Быть сильным и здоровым']],
  ] },
  { t: ['The best time with your child is:', 'Die schönste Zeit mit Ihrem Kind ist:', 'Le meilleur moment avec votre enfant :', 'Лучшее время с ребёнком:'], o: [
    ['storyteller', ['Reading or chatting before bed', 'Vorlesen oder Reden vor dem Schlafengehen', 'Lire ou discuter avant de dormir', 'Читать или болтать перед сном']],
    ['artist', ['Making something together', 'Zusammen etwas gestalten', 'Créer quelque chose ensemble', 'Вместе что-то творить']],
    ['explorer', ['Exploring a new place', 'Einen neuen Ort erkunden', 'Explorer un nouvel endroit', 'Исследовать новое место']],
    ['helper', ['Cuddling and just being together', 'Kuscheln und einfach zusammen sein', 'Les câlins et le simple fait d’être ensemble', 'Обниматься и просто быть рядом']],
  ] },
  { t: ['Friends would describe you as:', 'Freunde würden Sie so beschreiben:', 'Vos amis diraient de vous :', 'Друзья сказали бы о вас:'], o: [
    ['builder', ['Reliable and practical', 'Zuverlässig und praktisch', 'Quelqu’un de fiable et de pratique', 'Надёжный и практичный человек']],
    ['leader', ['Confident and decisive', 'Selbstsicher und entschlossen', 'Quelqu’un d’assuré, qui décide vite', 'Уверенный и решительный человек']],
    ['helper', ['Warm and caring', 'Warmherzig und fürsorglich', 'Quelqu’un de chaleureux et d’attentionné', 'Тёплый и заботливый человек']],
    ['artist', ['Creative, with good taste', 'Kreativ, mit gutem Geschmack', 'Quelqu’un de créatif, qui a du goût', 'Творческий человек со вкусом']],
  ] },
  { t: ['When something new comes up, you:', 'Wenn etwas Neues ansteht, dann:', 'Face à quelque chose de nouveau :', 'Когда появляется что-то новое, вы:'], o: [
    ['inventor', ['Read up on it first', 'Lesen Sie sich erst ein', 'Vous vous documentez d’abord', 'Сначала всё об этом читаете']],
    ['storyteller', ['Ask people who know', 'Fragen Sie Leute, die sich auskennen', 'Vous demandez à ceux qui connaissent', 'Расспрашиваете тех, кто знает']],
    ['explorer', ['Go and take a look yourself', 'Schauen Sie es sich selbst an', 'Vous allez voir par vous-même', 'Идёте и смотрите сами']],
    ['mover', ['Start right away and learn as you go', 'Legen Sie sofort los und lernen unterwegs', 'Vous vous lancez tout de suite et apprenez en route', 'Сразу начинаете и учитесь по ходу']],
  ] },
];

// Стиль родителя: прилагательное к слову «стиль» (без рода родителя)
export const STYLE = {
  builder: ['hands-on', 'praktisch', 'pratique', 'практичный'],
  inventor: ['curious', 'neugierig', 'curieux', 'любознательный'],
  storyteller: ['talkative', 'sprachgewandt', 'expressif', 'разговорный'],
  artist: ['creative', 'kreativ', 'créatif', 'творческий'],
  explorer: ['exploring', 'entdeckungsfreudig', 'explorateur', 'исследовательский'],
  leader: ['organizing', 'führungsstark', 'organisateur', 'организаторский'],
  helper: ['caring', 'fürsorglich', 'attentionné', 'заботливый'],
  mover: ['active', 'bewegungsfreudig', 'dynamique', 'деятельный'],
};

// Что родитель этого стиля даёт ребёнку
export const GIVE = {
  builder: ['You show how things are done and finish what you start. From you your child learns that effort leads to a result.', 'Sie zeigen, wie etwas geht, und bringen Angefangenes zu Ende. Von Ihnen lernt Ihr Kind, dass Mühe zu einem Ergebnis führt.', 'Vous montrez comment faire et vous terminez ce que vous commencez. Avec vous, votre enfant apprend que l’effort mène à un résultat.', 'Вы показываете, как это делается, и доводите начатое до конца. У вас ребёнок учится тому, что усилие приводит к результату.'],
  inventor: ['You answer a question with a question and enjoy thinking aloud. From you your child learns that not knowing is a start, not a failure.', 'Sie antworten auf eine Frage mit einer Frage und denken gern laut. Von Ihnen lernt Ihr Kind, dass Nichtwissen ein Anfang ist und kein Versagen.', 'Vous répondez à une question par une question et vous aimez réfléchir à voix haute. Avec vous, votre enfant apprend que ne pas savoir est un début, pas un échec.', 'Вы отвечаете вопросом на вопрос и любите рассуждать вслух. У вас ребёнок учится тому, что «не знаю» это начало, а не провал.'],
  storyteller: ['You talk things through and put feelings into words. From you your child learns to name what is going on inside.', 'Sie sprechen Dinge aus und finden Worte für Gefühle. Von Ihnen lernt Ihr Kind, zu benennen, was in ihm vorgeht.', 'Vous mettez des mots sur les choses et sur les émotions. Avec vous, votre enfant apprend à nommer ce qui se passe à l’intérieur.', 'Вы всё проговариваете и находите слова для чувств. У вас ребёнок учится называть то, что происходит внутри.'],
  artist: ['You notice beauty and make ordinary things special. From you your child learns that there is more than one right way.', 'Sie sehen das Schöne und machen aus Gewöhnlichem etwas Besonderes. Von Ihnen lernt Ihr Kind, dass es mehr als einen richtigen Weg gibt.', 'Vous remarquez la beauté et rendez spéciales les choses ordinaires. Avec vous, votre enfant apprend qu’il existe plus d’une bonne façon de faire.', 'Вы замечаете красоту и делаете обычное особенным. У вас ребёнок учится тому, что правильных способов больше одного.'],
  explorer: ['You bring the world home: places, facts, new things to try. From you your child learns curiosity.', 'Sie holen die Welt nach Hause: Orte, Fakten, Neues zum Ausprobieren. Von Ihnen lernt Ihr Kind Neugier.', 'Vous faites entrer le monde à la maison : des lieux, des faits, des nouveautés à essayer. Avec vous, votre enfant apprend la curiosité.', 'Вы приносите мир домой: места, факты, новое, что можно попробовать. У вас ребёнок учится любопытству.'],
  leader: ['You decide quickly and make things happen. Your child feels there is someone to rely on.', 'Sie entscheiden schnell und setzen Dinge um. Ihr Kind spürt, dass es sich auf jemanden verlassen kann.', 'Vous décidez vite et vous faites avancer les choses. Votre enfant sent qu’il y a quelqu’un sur qui compter.', 'Вы быстро решаете и доводите до дела. Ребёнок чувствует, что есть на кого опереться.'],
  helper: ['You sense moods and make home feel safe. From you your child learns to care about people.', 'Sie spüren Stimmungen und machen das Zuhause zu einem sicheren Ort. Von Ihnen lernt Ihr Kind, sich um andere zu kümmern.', 'Vous percevez les humeurs et vous faites de la maison un lieu rassurant. Avec vous, votre enfant apprend à prendre soin des autres.', 'Вы чувствуете настроение и делаете дом безопасным местом. У вас ребёнок учится заботиться о людях.'],
  mover: ['You have energy and prefer doing to talking. From you your child learns that moving is a way to feel good.', 'Sie haben Energie und handeln lieber, als zu reden. Von Ihnen lernt Ihr Kind, dass Bewegung guttut.', 'Vous avez de l’énergie et vous préférez agir plutôt que parler. Avec vous, votre enfant apprend que bouger fait du bien.', 'У вас много энергии, и вы предпочитаете делать, а не говорить. У вас ребёнок учится тому, что движение помогает чувствовать себя хорошо.'],
};

// На что обратить внимание родителю этого стиля
export const WATCH = {
  builder: ['You may step in and do it yourself because it is faster. Leave room for a crooked first try.', 'Sie greifen vielleicht ein und machen es selbst, weil es schneller geht. Lassen Sie Raum für einen schiefen ersten Versuch.', 'Vous risquez de prendre la main parce que cela va plus vite. Laissez de la place à un premier essai de travers.', 'Вы можете вмешаться и сделать сами, потому что так быстрее. Оставьте место для кривой первой попытки.'],
  inventor: ['You may explain for longer than your child can listen. One idea at a time.', 'Sie erklären vielleicht länger, als Ihr Kind zuhören kann. Eine Idee nach der anderen.', 'Vous risquez d’expliquer plus longtemps que votre enfant ne peut écouter. Une idée à la fois.', 'Вы можете объяснять дольше, чем ребёнок способен слушать. По одной мысли за раз.'],
  storyteller: ['You may fill the silences. Count to five before you help with a word.', 'Sie füllen vielleicht jede Pause. Zählen Sie bis fünf, bevor Sie mit einem Wort aushelfen.', 'Vous risquez de combler les silences. Comptez jusqu’à cinq avant de souffler un mot.', 'Вы можете заполнять паузы сами. Сосчитайте до пяти, прежде чем подсказать слово.'],
  artist: ['You may correct the result so that it looks better. Their own version is the point.', 'Sie verbessern vielleicht das Ergebnis, damit es schöner aussieht. Es geht aber um die eigene Version Ihres Kindes.', 'Vous risquez de corriger le résultat pour qu’il soit plus joli. C’est sa propre version qui compte.', 'Вы можете поправить результат, чтобы он выглядел лучше. Но смысл как раз в его собственной версии.'],
  explorer: ['You may move on to the next new thing too fast. Some children want to stay longer.', 'Sie gehen vielleicht zu schnell zum nächsten Neuen über. Manche Kinder möchten länger bleiben.', 'Vous risquez de passer trop vite à la nouveauté suivante. Certains enfants ont envie de rester plus longtemps.', 'Вы можете слишком быстро переходить к следующему новому. Некоторым детям хочется задержаться.'],
  leader: ['You may decide for your child. Offer two options and accept the choice.', 'Sie entscheiden vielleicht für Ihr Kind. Bieten Sie zwei Möglichkeiten an und nehmen Sie die Wahl an.', 'Vous risquez de décider à la place de votre enfant. Proposez deux options et acceptez son choix.', 'Вы можете решать за ребёнка. Предложите два варианта и примите его выбор.'],
  helper: ['You may smooth over every difficulty. A little struggle is useful.', 'Sie räumen vielleicht jede Schwierigkeit aus dem Weg. Ein wenig Anstrengung tut gut.', 'Vous risquez d’aplanir chaque difficulté. Un peu d’effort est utile.', 'Вы можете убирать с пути каждую трудность. Немного усилий ребёнку полезно.'],
  mover: ['Your pace may be too fast for a quieter child. Check that your child is keeping up.', 'Ihr Tempo ist für ein ruhigeres Kind vielleicht zu hoch. Prüfen Sie, ob Ihr Kind mitkommt.', 'Votre rythme est peut-être trop rapide pour un enfant plus calme. Vérifiez que votre enfant suit.', 'Ваш темп может быть слишком быстрым для спокойного ребёнка. Проверяйте, успевает ли он за вами.'],
};

// Что нужно ребёнку этого типа
export const NEEDS = {
  builder: ['Time to finish, and a place where a half-built project can stay overnight.', 'Zeit, um fertig zu werden, und einen Platz, an dem ein halb fertiges Projekt über Nacht stehen bleiben darf.', 'Du temps pour terminer, et un endroit où un projet inachevé peut rester jusqu’au lendemain.', 'Время, чтобы закончить, и место, где недостроенное может постоять до утра.'],
  inventor: ['Permission to test ideas and get it wrong without a lecture.', 'Die Erlaubnis, Ideen zu testen und sich zu irren, ohne Vortrag danach.', 'La permission de tester ses idées et de se tromper sans leçon de morale.', 'Разрешение проверять идеи и ошибаться без нотаций.'],
  storyteller: ['A listener: ten minutes a day when the story is not interrupted.', 'Jemanden, der zuhört: zehn Minuten am Tag, in denen die Geschichte nicht unterbrochen wird.', 'Quelqu’un qui écoute : dix minutes par jour où l’histoire n’est pas interrompue.', 'Слушатель: десять минут в день, когда рассказ никто не перебивает.'],
  artist: ['Freedom to choose the material, and no “do it like the sample”.', 'Die Freiheit, das Material zu wählen, und kein „Mach es wie in der Vorlage“.', 'La liberté de choisir la matière, et pas de « fais comme le modèle ».', 'Свобода выбирать материал и никакого «сделай как на образце».'],
  explorer: ['Time to look before acting, and trips to real places.', 'Zeit, erst zu schauen und dann zu handeln, und Ausflüge an echte Orte.', 'Du temps pour observer avant d’agir, et des sorties dans de vrais lieux.', 'Время сначала посмотреть, а потом действовать, и поездки в настоящие места.'],
  leader: ['Real responsibility: one area where their word is final.', 'Echte Verantwortung: ein Bereich, in dem Ihr Kind das letzte Wort hat.', 'Une vraie responsabilité : un domaine où votre enfant a le dernier mot.', 'Настоящая ответственность: одна область, где последнее слово за ребёнком.'],
  helper: ['To hear that their own wishes matter as much as other people’s.', 'Zu hören, dass die eigenen Wünsche genauso zählen wie die der anderen.', 'Entendre que ses propres envies comptent autant que celles des autres.', 'Слышать, что его собственные желания так же важны, как желания других.'],
  mover: ['To move before sitting down: activity first, a quiet task second.', 'Bewegung vor dem Stillsitzen: erst Aktivität, dann die ruhige Aufgabe.', 'Bouger avant de rester en place : d’abord l’activité, ensuite la tâche calme.', 'Подвигаться перед тем, как сесть: сначала активность, потом спокойное дело.'],
};

// Что сделать вместе на этой неделе (по типу ребёнка)
export const TOGETHER = {
  builder: ['Build one thing together where your child is the boss and you are the assistant.', 'Bauen Sie zusammen etwas, bei dem Ihr Kind bestimmt und Sie assistieren.', 'Construisez une chose ensemble : votre enfant dirige, vous assistez.', 'Постройте вместе одну вещь, где ребёнок главный, а вы помощник.'],
  inventor: ['Pick one “what happens if” question and test it together.', 'Wählen Sie eine „Was passiert, wenn“-Frage und probieren Sie es zusammen aus.', 'Choisissez une question « que se passe-t-il si » et testez-la ensemble.', 'Выберите один вопрос «а что будет, если» и проверьте его вместе.'],
  storyteller: ['Make up a bedtime story in turns, one sentence each.', 'Erfinden Sie abwechselnd eine Gutenachtgeschichte, jeder einen Satz.', 'Inventez une histoire du soir à tour de rôle, une phrase chacun.', 'Сочините сказку на ночь по очереди, по одному предложению.'],
  artist: ['Make one picture together with one rule: nobody comments until the end.', 'Malen Sie zusammen ein Bild mit einer Regel: Bis zum Schluss wird nichts kommentiert.', 'Faites un dessin ensemble avec une seule règle : aucun commentaire avant la fin.', 'Нарисуйте одну картину вместе с одним правилом: до конца никто ничего не комментирует.'],
  explorer: ['Take a familiar route and let your child lead and choose where to stop.', 'Gehen Sie einen bekannten Weg und lassen Sie Ihr Kind führen und entscheiden, wo angehalten wird.', 'Prenez un trajet connu et laissez votre enfant guider et choisir où s’arrêter.', 'Пройдите знакомым маршрутом: пусть ребёнок ведёт и выбирает, где остановиться.'],
  leader: ['For one evening your child is in charge of the plan and you follow.', 'Einen Abend lang bestimmt Ihr Kind den Plan, und Sie machen mit.', 'Le temps d’une soirée, votre enfant décide du programme et vous suivez.', 'На один вечер ребёнок отвечает за план, а вы следуете.'],
  helper: ['Do one kind thing for someone together, and then one thing just for your child.', 'Tun Sie zusammen jemandem etwas Gutes und danach etwas nur für Ihr Kind.', 'Faites ensemble une bonne action pour quelqu’un, puis une chose rien que pour votre enfant.', 'Сделайте вместе одно доброе дело для кого-то, а потом одно дело только для ребёнка.'],
  mover: ['Learn one new physical trick together and practice it for a week.', 'Lernen Sie zusammen einen neuen Bewegungstrick und üben Sie ihn eine Woche lang.', 'Apprenez ensemble une nouvelle figure et entraînez-vous pendant une semaine.', 'Разучите вместе один новый трюк и тренируйте его неделю.'],
};

export const UI = {
  title: ['You and your child: a 2-minute mini-test', 'Sie und Ihr Kind: ein Mini-Test in 2 Minuten', 'Vous et votre enfant : un mini-test de 2 minutes', 'Ребёнок и вы: мини-тест на 2 минуты'],
  kicker: ['Mini-test for subscribers', 'Mini-Test im Abo', 'Mini-test inclus dans l’abonnement', 'Мини-тест для подписчиков'],
  h1: ['You and your child', 'Sie und Ihr Kind', 'Vous et votre enfant', 'Ребёнок и вы'],
  sub: ['10 questions about you. See how your own style meets your child’s thinking style, and what to do with it this week.', '10 Fragen über Sie. Sehen Sie, wie Ihr eigener Stil auf den Denkstil Ihres Kindes trifft und was Sie diese Woche daraus machen können.', '10 questions sur vous. Découvrez comment votre style rencontre le style de pensée de votre enfant, et quoi en faire cette semaine.', '10 вопросов о вас. Узнайте, как ваш стиль сочетается с типом мышления ребёнка и что с этим делать на этой неделе.'],
  cta: ['Start', 'Starten', 'Commencer', 'Начать'],
  note: ['Not a psychological assessment. It is a way to look at everyday habits.', 'Keine psychologische Beurteilung. Ein Blick auf Gewohnheiten im Alltag.', 'Ce n’est pas une évaluation psychologique. C’est un regard sur les habitudes du quotidien.', 'Это не психологическая оценка. Это способ посмотреть на повседневные привычки.'],
  back: ['Back', 'Zurück', 'Retour', 'Назад'],
  count: ['{n} of {t}', '{n} von {t}', '{n} sur {t}', '{n} из {t}'],
  childQ: ['Which thinking style did your child’s test show?', 'Welchen Denkstil hat der Test Ihres Kindes gezeigt?', 'Quel style de pensée le test de votre enfant a-t-il montré ?', 'Какой тип мышления показал тест ребёнка?'],
  childTest: ['I haven’t taken the child’s test yet', 'Ich habe den Test für mein Kind noch nicht gemacht', 'Je n’ai pas encore fait le test de mon enfant', 'Я ещё не проходил тест ребёнка'],
  yourStyle: ['Your style as a parent', 'Ihr Stil als Elternteil', 'Votre style de parent', 'Ваш стиль как родителя'],
  childStyle: ['Your child', 'Ihr Kind', 'Votre enfant', 'Ваш ребёнок'],
  same: ['You share a style, so understanding comes easily. The other side: you may overlook the same things. It helps to bring people with other styles into your child’s life.', 'Sie teilen einen Stil, deshalb verstehen Sie sich leicht. Die Kehrseite: Sie übersehen womöglich dieselben Dinge. Es hilft, Menschen mit anderen Stilen ins Leben Ihres Kindes zu holen.', 'Vous partagez le même style : vous vous comprenez facilement. Le revers : vous risquez de passer à côté des mêmes choses. Il est utile de faire entrer dans la vie de votre enfant des personnes d’un autre style.', 'У вас один стиль, поэтому вы легко понимаете друг друга. Обратная сторона: вы можете не замечать одно и то же. Полезно, чтобы в жизни ребёнка были люди с другим стилем.'],
  diff: ['You think differently, and that is useful: your child gets from you what does not come naturally. It also means that what recharges you can tire your child.', 'Sie denken unterschiedlich, und das ist nützlich: Ihr Kind bekommt von Ihnen, was ihm nicht von selbst zufällt. Es heißt aber auch: Was Ihnen Kraft gibt, kann Ihr Kind ermüden.', 'Vous pensez différemment, et c’est utile : votre enfant reçoit de vous ce qui ne lui vient pas naturellement. Cela veut dire aussi que ce qui vous ressource peut fatiguer votre enfant.', 'Вы думаете по-разному, и это полезно: ребёнок получает от вас то, что не даётся ему само. Но это значит и то, что ваш отдых может его утомлять.'],
  give: ['What you give your child', 'Was Sie Ihrem Kind geben', 'Ce que vous apportez à votre enfant', 'Что вы даёте ребёнку'],
  watch: ['What to watch for', 'Worauf Sie achten können', 'Le point à surveiller', 'На что обратить внимание'],
  needs: ['What your child needs from you', 'Was Ihr Kind von Ihnen braucht', 'Ce dont votre enfant a besoin de votre part', 'Что ребёнку нужно от вас'],
  together: ['Try this week', 'Diese Woche ausprobieren', 'À essayer cette semaine', 'Попробуйте на этой неделе'],
  lockTitle: ['The full result is part of the subscription', 'Das vollständige Ergebnis gehört zum Abo', 'Le résultat complet fait partie de l’abonnement', 'Полный результат входит в подписку'],
  lockLead: ['Take the “How does your child think?” test. The subscription opens the full report, the activity of the day and this mini-test.', 'Machen Sie den Test „Wie denkt Ihr Kind?“. Das Abo öffnet den vollständigen Bericht, die Aufgabe des Tages und diesen Mini-Test.', 'Faites le test « Comment pense votre enfant ? ». L’abonnement ouvre le rapport complet, l’activité du jour et ce mini-test.', 'Пройдите тест «Как думает ваш ребёнок». Подписка открывает полный отчёт, задание дня и этот мини-тест.'],
  lockCta: ['Go to the child’s test', 'Zum Test für Ihr Kind', 'Vers le test de l’enfant', 'К тесту ребёнка'],
  toReport: ['Back to the report', 'Zurück zum Bericht', 'Retour au rapport', 'Назад к отчёту'],
  again: ['Take it again', 'Noch einmal machen', 'Refaire le test', 'Пройти заново'],
};
