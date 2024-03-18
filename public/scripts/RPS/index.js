// https://opentdb.com/api_category.php

$(document).ready(async () => {
    $('#submit').on('click', async () => {
        try {
            const data = await $.ajax({ url: `https://opentdb.com/api_token.php?command=request` });
            const token = data.token
            $("#token").attr("value", token ? token : " ")
          } catch (error) {
            console.log(error);
          }
        $('form').submit()
    })

    try {
        const data = await $.ajax({ url: `https://opentdb.com/api_category.php` });
        const categories = data.trivia_categories
        const elemnt = $('#category')
        $('#category > option').text('Any Category')
        categories.forEach(category => {
            elemnt.append(`<option value="${category.id}">${category.name}</option>`)
        });
      } catch (error) {
        console.log(error);
      }

})