// To fix the error from the example
function cleanExampleText(text) {
    return text.replace(/{wi}/g, '<strong>').replace(/{\/wi}/g, '</strong>');
}

// pronunciation audio file
function playAudio(audioURL) {
    const audio = new Audio(audioURL);
    audio.play();
}

document.getElementById('searchButton').addEventListener('click', searchWord);

function searchWord(event) {
    const searchTerm = document.getElementById('searchTerm').value.trim();
    if (!searchTerm) return;

    const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(searchTerm)}?key=9337c375-e00f-45b8-b624-c22b06df54d4`;
    
    fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .then(result => {
        const resultDiv = document.getElementById('result');
        const suggestionsDiv = document.getElementById('suggestions');
        resultDiv.innerHTML = '';
        suggestionsDiv.innerHTML = '';
        
        if (Array.isArray(result) && result.length > 0) {
            if (typeof result[0] === 'string') {
                // Suggest related or idiom words
                suggestionsDiv.innerHTML = `<p>No exact match found. Did you mean:</p><ul>${result.map(word => `<li class="suggest_word"><a href="#" onclick="document.getElementById('searchTerm').value='${word}'; searchWord(); return false;">${word}</a></li>`).join('')}</ul>`;
                return;
            }
            
            let exactMatchOutput = '<div class="result-section"><h2 class="result-title">Exact Match</h2>';
            let relatedWordsOutput = '<div class="result-section"><h2 class="result-title">Related Words</h2>';
            let exactMatchFound = false;
            let relatedWordsFound = false;

            result.forEach(entry => {
                const word = entry.hwi?.hw || searchTerm;
                const pronunciation = entry.hwi?.prs?.[0]?.mw || '';
                const audioFile = entry.hwi?.prs?.[0]?.sound?.audio || null;
                const partOfSpeech = entry.fl || 'Unknown';
                const definitions = entry.shortdef ? entry.shortdef.map(def => `<li>${def}</li>`).join('') : '';
                
                let audioHTML = '';
                if (audioFile) {
                    const subfolder = audioFile.charAt(0);
                    const audioURL = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subfolder}/${audioFile}.mp3`;
                    audioHTML = `<button class="audio-button" onclick="playAudio('${audioURL}')">🔊</button>`;
                }

                let examples = '';
                if (entry.def && entry.def[0]?.sseq) {
                    const exampleEntry = entry.def[0].sseq.find(s => s[0][1]?.dt?.some(d => d[0] === 'vis'));
                    if (exampleEntry) {
                        const exampleData = exampleEntry[0][1].dt.find(d => d[0] === 'vis');
                        if (exampleData && exampleData[1]?.[0]?.t) {
                            examples = `<span class="examples"> ${cleanExampleText(exampleData[1][0].t)}</span>`;
                        }
                    }
                }
                
                // Result section
                const entryHTML = `
                    <div class="word-header">
                        ${word ? `<span class="word"> ⁃ ${word}</span>` : ''} 
                        ${partOfSpeech ? `<span class="partofspeech"> (${partOfSpeech})</span>` : ''}
                        ${pronunciation ? `<span class="pronunciation">[${pronunciation}]</span>` : ''}
                        ${audioHTML}
                    </div>
                    <div class="def-section">
                        ${definitions}
                        ${examples ? `<span class="ex_title">✏️ Example : ${examples}</span>` : ''}
                    </div>
                `;

                if (word.toLowerCase() === searchTerm.toLowerCase()) {
                    exactMatchOutput += entryHTML;
                    exactMatchFound = true;
                } else {
                    relatedWordsOutput += entryHTML;
                    relatedWordsFound = true;
                }
            });

            exactMatchOutput += '</div>';
            relatedWordsOutput += '</div>';
            resultDiv.innerHTML = (exactMatchFound ? exactMatchOutput : '') + (relatedWordsFound ? relatedWordsOutput : '');
        } else {
            resultDiv.innerHTML = `<p>No definition found.</p>`;
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        document.getElementById('result').innerHTML = '<p>Error fetching definition. Please try again later.</p>';
    });
}


