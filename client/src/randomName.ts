import * as pokemon from 'pokemon';


export default function(){
	const lang = detectLanguage();
	return pokemon.random(lang);
}

function detectLanguage() : pokemon.Language {
	//return 'en' ;

	const lang = (
		(navigator.languages && navigator.languages[0]) ||
		navigator.language ||
		navigator.userLanguage
	);

	if (!lang)
		return 'en';
	//regular expressions to test langiage
	if (/^en/i.test(lang))
		return 'en';
	else if (/^de/i.test(lang))
		return 'de';
	else if (/^fr/i.test(lang))
		return 'fr';
	else if (/^ja/i.test(lang))
		return 'ja';
	else if (/^ko/i.test(lang))
		return 'ko';
	else if (/^ru/i.test(lang))
		return 'ru';
	else if (/^de/i.test(lang))
		return 'de';
	else
		return 'en';
}
