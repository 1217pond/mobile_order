$("#start_trg").on("click",()=>{
    console.log("start");
    setTimeout(()=>{
        $("#title_scene").hide();
        window.scroll({top: 0,behavior: "instant"});
        $("#menu_scene").show();
    },1500);
});

$("#main_select_trg").on("click",e=>{
    target = $(e.target);
    if(target.attr("selected")){
        $("#alert_window p").text(`ケバブ(主食)をキャンセルしました。`);
        $("#alert_window").show();
        target.text("かごにいれる");
        target.attr("selected",false);
        order_data.kebab.count=0;
    }else{
        $("#confirm_window p").text(`あなたはチケットを持っていますか？`);
        $("#confirm_window").show();
    }
});

$("#confirm_no_trg").on("click",e=>{
    switch($("#confirm_window p").text()){
        case "あなたはチケットを持っていますか？":
            $("#confirm_window").hide();
            break;
    }
});

$("#confirm_yes_trg").on("click",e=>{
    switch($("#confirm_window p").text()){
        case "あなたはチケットを持っていますか？":
            $("#confirm_window").hide();
            $("#alert_window p").text(`ケバブ(主食)をかごに入れました。`);
            $("#alert_window").show();
            $("#main_select_trg").text("キャンセル");
            $("#main_select_trg").attr("selected",true);
            order_data.kebab.count=1;
            break;
    }
});

$(".increment_trg").on("click",e=>{
    target = $(e.target);
    meal_id = target.data("target");
    console.log(meal_id,order_data[meal_id]);
    if(order_data[meal_id].count == 0){
        target.siblings(".decrement_trg").attr("disabled",false);
    }
    order_data[meal_id].count++;
    target.siblings(".text_count").text(order_data[meal_id].count);
});

$(".decrement_trg").on("click",e=>{
    target = $(e.target);
    meal_id = target.data("target");
    console.log(meal_id,order_data[meal_id]);
    order_data[meal_id].count--;
    if(order_data[meal_id].count == 0){
        target.attr("disabled",true);
    }
    target.siblings(".text_count").text(order_data[meal_id].count);
});



$("#alert_window button").on("click",()=>{
    console.log("close");
    $("#alert_window").hide();
});

$("#order_trg").on("click",()=>{
    console.log(order_data);
    $("#order_list").empty();
    total_price=0;
    for(let [meal_id,order] of Object.entries(order_data)){
        if(order.count>0){
            $("#order_list").append(`<li>${order.name}${meal_id=="kebab" ? "　※主食はチケットを持っていないと食べられません！" : ` × ${order.count}`}</li>`);
            total_price += order.price * order.count;
        }
    }
    $(".total_price").text(`￥${total_price}-`);

    $("#menu_scene").hide();
    window.scroll({top: 0,behavior: "instant"});
    $("#check_scene").show();
});

$("#order_cancel_trg").on("click",()=>{
    $("#menu_scene").show();
    window.scroll({top: 0,behavior: "instant"});
    $("#check_scene").hide();
});

$("#order_apply_trg").on("click",()=>{
    $("#wait_window p").text("注文を送信中...");
    $("#wait_window").show();

    let order = {};

    for(let [meal_id,order_datum] of Object.entries(order_data)){
        if(order_datum.count>0){
            order[meal_id] = order_datum.count;
        }
    }

    console.log(order);

    fetch(SERVER_ADDRESS,{
        method:"POST",
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
            type:"order",
            seat_id:urlParams.get("seat_id"),
            order:order,
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }else{
            throw "Network response was not ok";
        }
    })
    .then(data => {
        $("#order_id").text(data.order_id);
        let receipt_uri = encodeURI(
            location.hostname+
            `/mobile_order/check.html?s=${urlParams.get("seat_id")}&o=${data.order_id}&u=${data.uuid}&`+
            `kebab=${order.kebab|0}&nope=${order.nope|0}&ice=${order.ice|0}&crepe=${order.crepe|0}&chicken=${order.chicken|0}&doritos=${order.doritos|0}`
        );
        console.log(receipt_uri);
        $("#qr").empty();
        $("#qr").qrcode({
            text:receipt_uri,
            width:500,height:500
        });
        $("#wait_window p").text("注文を検証中...");

        setTimeout(() => {
            fetch(SERVER_ADDRESS,{
                method:"POST",
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify({
                    type:"check",
                    uuid:data.uuid,
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }else{
                    throw "Network response was not ok";
                }
            })
            .then(data => {
                if(data.exist){
                    $("#check_scene").hide();
                    $("#wait_window").hide();
                    window.scroll({top: 0,behavior: "instant"});
                    $("#receipt_scene").show();
                }else{
                    $("#wait_window").hide();
                    $("#alert_window p").text(`注文の送信に失敗しました。少し時間を空けてから再度送信してください。\n(Error:the order does not exist)`);
                    $("#alert_window").show();
                }
            }).catch(e => {
                $("#wait_window").hide();
                $("#alert_window p").text(`注文の送信に失敗しました。少し時間を空けてから再度送信してください。\n(${e.name}:${e.message})`);
                $("#alert_window").show();
                console.error('There was a problem with the fetch operation:', e);
            });
        }, 2000);
    })
    .catch(e => {
        $("#wait_window").hide();
        $("#alert_window p").text(`注文の送信に失敗しました。少し時間を空けてから再度送信してください。\n(${e.name}:${e.message})`);
        $("#alert_window").show();
        console.error('There was a problem with the fetch operation:', e);
    });
});

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
$("#seat_id").text(urlParams.get("seat_id"));

window.order_data = {
    "kebab":{
        "count":0,
        "price":0,
        "name":"ケバブ"
    },
    "nope":{
        "count":0,
        "price":150,
        "name":"NOPE"
    },
    "ice":{
        "count":0,
        "price":80,
        "name":"かき氷"
    },
    "crepe":{
        "count":0,
        "price":120,
        "name":"クレープ"
    },
    "chicken":{
        "count":0,
        "price":130,
        "name":"焼き鳥"
    },
    "doritos":{
        "count":0,
        "price":100,
        "name":"ドリトス"
    },
};

window.SERVER_ADDRESS = "https://script.google.com/macros/s/AKfycbzcC6BAv4YC3DLHGX4RxLZL1ro8YcS-KJJwauU8rZSp0weYaekcyuMI-EQOfGJcwsW0Kw/exec";