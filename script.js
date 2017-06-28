let page; // current page
let pageCount; // total number of pages for seached query


$(document).ready(function () {

	// search button clicked
	$('#searchButton').on('click', () => {
		page = 1;
		getArticles();
	});


	// Enter pressed in the query textbox
	$('#query').keypress( e => {
      if(e.keyCode == '13'){
     	page = 1;
			getArticles();
    }
  });


	// pagination item clicked
	$('#pagination').on('click', 'a', function(e) {
		e.preventDefault(); // do not scroll the page
		// make sure that the user will display only one the available pages
		if(this.dataset.page > 0 && this.dataset.page <= pageCount)	{
			page = this.dataset.page;
			getArticles();
		}
	});
});


// get articles from NYTimes API
function getArticles() {
	let query = $('#query').val(); // get use query
	let dateFrom = $('#dateFrom').val().replace(/\D/g, ''); // get start date and filter out everything that is not a digit
	let dateTo = $('#dateTo').val().replace(/\D/g, ''); // get end date and filter out everything that is not a digit

	// display "Loading articles..." text so the user knew something is happening
	$('#searchResults').html('<div class="alert alert-info">Loading articles...</div>');	
	
	// prepare the url
	let url = "https://api.nytimes.com/svc/search/v2/articlesearch.json";
	url += '?' + $.param({
	  'api-key': "1e8db867c3d54577bcc05fbe93f16f0f",
	  'q': query,
	  'begin_date': dateFrom,
	  'end_date': dateTo,
	  'page': page-1
	});

	// try to get articles
	$.ajax({
	  url: url,
	  method: 'GET',
	})
	.done(function(result) {
	  displayArticles(result);
	})
	.fail(function(err) {
		displayError();
	});
}


// display articles recived from the API
function displayArticles(result) {
  let resultsLength = result.response.docs.length; // total number of found articles (max 10 per single API request)
  let resultsHTML = ''; // HTML for displaying articles
  pageCount = Math.ceil(result.response.meta.hits/10); // total number of pages with articles (10 articles per page)
  $('#pagination').html(''); // remove all pagination items

  // display boxes with articles
  if (resultsLength === 0) {
  	// display a proper message when no articles were found for user's query
  	$('#searchResults').html('<div class="alert alert-danger">Could not find any articles. Try with some other query!</div>');	
  } else {
  	// display all found articles
	  for (let i = 0; i < resultsLength; i++) {
	  	let article = result.response.docs[i];
		  let title = article.headline.main;
		  let date = new Date(article.pub_date);
		  let year = date.getFullYear();
		  let month = (date.getMonth()+1 < 10) ? '0' + (date.getMonth()+1) : date.getMonth()+1;
		  let day = (date.getDate() < 10) ? '0' + date.getDate() : date.getDate();
		  let lead = article.lead_paragraph;
		  let url = article.web_url;

		  resultsHTML += `
		  	<article class="articleBox">
			  	<h2>${title}</h2>
			  	<p><em>Published: ${year}-${month}-${day}</em></p>
			  	<p>${lead}</p>
			  	<a href="${url}" target="_blank">Click to read full article</a>
		  	</article>
		  `;
	  }

	  // udpate results HTML
		$('#searchResults').html(resultsHTML);

   	// display pagination elements if needed
   	if (pageCount > 1) {
	   	displayPagination();
   	}
  }
}


// disaply pagination items
function displayPagination() {
	// "<<"" and "<"" items (always present)
 	let paginationHTML = '<ul class="pagination pagination-sm">';
 	paginationHTML += `<li class=${page == 1 ? "disabled" : ""}><a href="#" data-page="1">&lt;&lt;</a></li>`; // element inactive when user is on the 1st page
 	paginationHTML += `<li class=${page == 1 ? "disabled" : ""}><a href="#" data-page="${page-1}">&lt;</a></li>`; // element inactive when user is on the 1st page

 	// if there's only max 10 pages, display pagination items for all of them
	if (pageCount <= 10) {	
   	for (let i = 1; i <= pageCount; i++) {
   		let activeClass = (i == page) ? "active" : ""; // if user is on that page, make its pagination item active
   		paginationHTML += `
  			<li class=${activeClass}><a href="#" data-page="${i}">${i}</a></li>
   		`;
   	}
	} else { // when there's more than 10 pages, display only some paginations items and 1 or 2 "..." items
		// pagination element for 1st page (always present)
		paginationHTML += `<li class=${(page == 1) ? "active" : ""}><a href="#" data-page="1">1</a></li>`; 
		
		// "..." item (displayed only when user reads page number 6 or more)
		if (page > 5) {
			paginationHTML += `<li class="disabled"><a href="#">...</a></li>`;
		}

		// figure out how much pagination items shoul be displayed before and after a pagination item for current page (max 3 previous pages and max 3 next pages)
		let startPage = (page > 5) ? page - 3 : 2;
		let endPage = (page < pageCount - 4) ? parseInt(page) + 3 : pageCount - 1;

		// display pagination items (max 3 previous pages, current page, and max 3 next pages)
	 	for (let i = startPage; i <= endPage; i++) {
	 		let activeClass = (i == page) ? "active" : ""; // if user is on that page, make its pagination item active
	 		paginationHTML += `
				<li class=${activeClass}><a href="#" data-page="${i}">${i}</a></li>
	 		`;
	 	}

	 	// "..." item (displayed only when user reads page number n-5 or less)
	 	if (page < pageCount - 4) {
			paginationHTML += `<li class="disabled"><a href="#">...</a></li>`;
	 	}

		// pagination element for last page (always present)
		paginationHTML += `<li class=${(page == pageCount) ? "active" : ""}><a href="#" data-page="${pageCount}">${pageCount}</a></li>`; 
	}

	// ">"" and ">>"" items (always present)
 	paginationHTML += `<li class=${page == pageCount ? "disabled" : ""}><a href="#" data-page="${parseInt(page)+1}">&gt;</a></li>`;
 	paginationHTML += `<li class=${page == pageCount ? "disabled" : ""}><a href="#" data-page="${pageCount}">&gt;&gt;</a></li>`;
 	paginationHTML += '</ul>';
	$('#pagination').html(paginationHTML); // udpate pagination HTML
} 


// display an error message when something went wrong
function displayError() {
	$('#searchResults').html('<div class="alert alert-danger">Error: search parameters incorrect!</div>');
	$('#pagination').html(''); // remove all pagination items
}