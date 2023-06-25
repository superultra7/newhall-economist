const fillTemplate = (templateString, templateVars) => {
  return new Function("return `"+templateString +"`;").call(templateVars);
}

const articlesByTag = {}; // a very basic search index

(() => {
    // load all the article data
    fetch("articles.json")
	.then(res => { return res.json(); })
	.then(allArticleData => {

	    // keep track of the article ids (sequentially) so we can reference them later when searching for tags
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
			});

		    if(articleData.topics) {
			// if there are tags for this article, keep track of them
			articleData.topics.forEach((tag) => {
			    if(!articlesByTag[tag]) {
				// if we haven't stored any articles for this tag, initialise with an empty array
				articlesByTag[tag] = [];
			    }

			    // store the article id against this tag (meaning we can look up the article ids for any given tag when searching)
			    articlesByTag[tag].push(articleId);
			});
		    }

		    articleId += 1;
		});
	})

	.then(() => {
	    console.log(articlesByTag);
	    Object.keys(articlesByTag).sort().forEach((tag) => {
		$('#tags').append($(`<li class="nav-item"><a class="nav-link" href="?tag=${tag}">${tag}</a></li>`));
	    });

	    const tagQuery = document.location.href   // from the URL in the address bar...
		  .split('#')[0]                    // trim any following internal # anchors
		  .split('?')[1]                    // trim any preceeding URL
	    ?.split(/[;&]/)                         // split query parameters by ; or &
	    ?.filter(x => x.match(/^tag=/))[0]   // discard anything except tag=xxx
	    ?.split('=')[1];                     // split on = and retain value

	    const expandArticles = tagQuery ? articlesByTag[decodeURI(tagQuery)] : [ 0 ];

	    expandArticles?.forEach((articleId) => {
		$(`#collapse${articleId}`).addClass('show');
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
