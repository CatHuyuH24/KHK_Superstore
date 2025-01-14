async function renderAboutUsPage(req, res) {
    try {
        res.render('aboutUS');
    } catch (error) {
        console.error('Error handler about us:', error);
    }
}

module.exports = {
    renderAboutUsPage,
};