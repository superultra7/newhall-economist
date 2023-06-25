const fillTemplate = (templateString, templateVars) => {
  return new Function("return `"+templateString +"`;").call(templateVars);
}

const articlesByTopic = {}; // a very basic search index

(() => {
    // show/hide articles based on topic query in URL
    const topicQueryEncoded = document.location.href // from the URL in the address bar...
	  .split('#')[0]                    // trim any following internal # anchors
	  .split('?')[1]                    // trim any preceeding URL
    ?.split(/[;&]/)                         // split query parameters by ; or &
    ?.filter(x => x.match(/^topic=/))[0]      // discard anything except topic=xxx
    ?.split('=')[1];                        // split on = and retain value
    const topicQuery = decodeURI(topicQueryEncoded || "");

    // load all the article data
    fetch("articles.json")
	.then(res => { return res.json(); })
	.then(allArticleData => {

	    // keep track of the article ids (sequentially) so we can reference them later when searching for topics
	    let articleId = 0;

	    // iterate over articles and fill in a copy of the template for each one
	     allArticleData
		.forEach(articleData => {
		    const templateName = articleData.template || "card-horizontal";
		    // load the panel template
		    fetch(`templates/${templateName}.html`)
			.then(res => { return res.text(); })
			.then(panelTemplate => {
			    return $(fillTemplate(panelTemplate, {
				articleId,
				...articleData,
				pdf: articleData.pdf.match(/^http/) ? articleData.pdf : `pdf/${articleData.pdf}`,
			    }));
			})
			.then(panel => {
			    // "append" function tacks the panel content onto the end of the article container
			    $('#articles').append(panel);

			    if(topicQuery) {
				if(articleData.topics.includes(topicQuery)) {
				    $(panel).show();
				} else {
				    $(panel).hide();
				}
			    } else {
				$(panel).show();
			    }
			});

		    if(articleData.topics) {
			// if there are topics for this article, keep track of them
			articleData.topics.forEach((topic) => {
			    if(!articlesByTopic[topic]) {
				// if we haven't stored any articles for this topic, initialise with an empty array
				articlesByTopic[topic] = [];
			    }

			    // store the article id against this topic (meaning we can look up the article ids for any given topic when searching)
			    articlesByTopic[topic].push(articleId);
			});
		    }

		    articleId += 1;
		});
	})

	.then(() => {
	    // populate header bar with topic links
	    Object.keys(articlesByTopic).sort().forEach((topic) => {
		$('#topics').append($(`<li class="nav-item"><a class="nav-link ${topic === topicQuery ? 'active' : ''}" href="?topic=${topic}">${topic}</a></li>`));
	    });
	})
	.then(() => {
	    const pdfModal = document.getElementById('pdfModal');
	    pdfModal.addEventListener('show.bs.modal', event => {
		// Button that triggered the modal
		const button = event.relatedTarget
		// Extract target url from data-bs-* attributes
		const pdfURL = button.getAttribute('data-bs-whatever')
		// Update the modal's content.
		const modalTitle = pdfModal.querySelector('.modal-title')
    
		const modalBodyEmbed = pdfModal.querySelector('.modal-body')
		const height = $(window).height() - 100;
		$(modalBodyEmbed).html(`<embed src="${pdfURL}" frameborder="0" width="100%" height="${height}px">`);
	    })
	});
})();
