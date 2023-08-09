const PDFJS = window['pdfjs-dist/build/pdf'];
window.jsPDF = window.jspdf.jsPDF;
let pageContent = [];
let summarizedData = []
let loader = document.querySelector(".loader-container");
let pdfContent = document.querySelector('.SummarizedContent');
let file;

function errorToast(text){
    toastr["error"](text, "Error")

    toastr.options = {
        "closeButton": true,
        "debug": false,
        "progressBar": true,
        "positionClass": "toast-bottom-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }
}

const loadPdf = async (pdfUrl) => {
    try {
        return await PDFJS.getDocument(pdfUrl).promise;
    } catch (error) {
        errorToast("Failed to load PDF");
        throw new Error('Failed to load PDF');
    }
};
const extractTextFromPdf = async (pdf) => {
    const numPages = pdf.numPages;
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        pageContent.push({
            "pageNum": i,
            "content": pageText
        });
    }
    return pageContent;
};
const summarizeText = async (prompt) => {
    try {
        const response = await fetch(`http://localhost:3000/api/summarize?prompt="${prompt}"`);
        if (!response.ok) {
            errorToast("Failed to get summarization response")
            throw new Error('Failed to get summarization response');
        }
        const data = await response.json();
        summarizedData.push(data.summary)
    }
    catch (error) {
        errorToast("Failed to summarize text")
        throw new Error('Failed to summarize text');
    }

};
document.getElementById("pdfInput").addEventListener("change", (event) => {
     file = event.target.files[0]; // Get the uploaded file
});

function Convert_HTML_To_PDF(elementHTML) {
    let doc = new jsPDF();
    doc.html(elementHTML, {
        callback: function(doc) {
            doc.save('SummarizedAI.pdf');
        },
        margin: [10, 10, 10, 10],
        autoPaging: 'text',
        x: 0,
        y: 0,
        width: 190,
        windowWidth: 675
    });
}

function pdfLayout(data){

    const contentToPrint = document.createElement('div');
    contentToPrint.id = 'contentToPrint';

    const header = document.createElement('center');
    const headerTitle = document.createElement('h1');
    headerTitle.innerHTML = '<span>PDF</span> Summarizer';
    header.appendChild(headerTitle);
    contentToPrint.appendChild(header);

    const firstParagraph = document.createElement('p');
    firstParagraph.textContent = 'The PDF Summarizer is a web-based application that allows users to upload their PDF documents and receive a summarized version, Provides a convenient way to summarize lengthy PDF documents using OpenAI';
    contentToPrint.appendChild(firstParagraph);

    const secondParagraph = document.createElement('p');
    secondParagraph.textContent = '- Soufiyane AitMoulay';
    contentToPrint.appendChild(secondParagraph);

    const hr = document.createElement('hr');
    contentToPrint.appendChild(hr);

    const summarizedContent = document.createElement('div');
    summarizedContent.classList.add('SummarizedContent');
    contentToPrint.appendChild(summarizedContent);

    data.forEach((e,i)=>{
        const pageContent = document.createElement('div');
        pageContent.classList.add('Pagecontent');
        summarizedContent.appendChild(pageContent);

        const pageTitle = document.createElement('h1');
        pageTitle.textContent = `Page ${i+1}`;
        pageContent.appendChild(pageTitle);

        const pageContentText = document.createElement('p');
        pageContentText.textContent = `${e}`
        pageContent.appendChild(pageContentText);
    })

    return contentToPrint

}

document.getElementById("summarize").addEventListener("click",(c)=>{
    c.preventDefault();
    var reader = new FileReader();
    if (file) {
        loader.style.display="flex"
        if(localStorage.getItem(file.name)===null){
            reader.onload = function (e) {
                var fileData = e.target.result;
                loadPdf(fileData)
                    .then(pdf => {
                        if (pdf) {
                            return extractTextFromPdf(pdf);
                        }
                    })
                    .then(pageContent => {
                        if (pageContent) {
                            summarizedData = [];
                            const promises = pageContent.map(page => summarizeText(page.content));
                            return Promise.all(promises);
                        }
                    })
                    .then(() => {
                        pageContent = [];
                        loader.style.display = "none"
                        localStorage.setItem(file.name,summarizedData)
                        Convert_HTML_To_PDF(pdfLayout(summarizedData));

                    })
                    .catch(error => {
                        console.error(error);
                    });
            };
            reader.readAsArrayBuffer(file);
        }
        else{
            console.log("File already stored")
            console.log(localStorage.getItem(file.name))
        }
    }
    else {
        errorToast("No file has been selected");
    }
})

