$("#start_trg").on("click",()=>{
    console.log("start");
    setTimeout(()=>{
        $("#title_scene").hide();
        window.scroll({top: 0,behavior: "instant"});
        $("#menu_scene").show();
        $("#wait_window p").text("在庫を取得中");
        $("#wait_window").show();
        fetch(SERVER_ADDRESS,{
            method:"POST",
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({
                type:"remain"
            })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }else{
                throw new Error("Network response was not ok");
            }
        })
        .then(data => {
            if(data.result == "OK"){
                console.log(data);
                $("#wait_window").hide();
                for(let [i,id] of Object.entries(Object.keys(order_data))){
                    if(data.remains[i]<=0){
                        $(`#${id}_span #available`).hide();
                        $(`#${id}_span #unavailable`).show();
                    }else{
                        $(`#${id}_span #remain_count`).text(data.remains[i]);
                        order_data[id].remain = data.remains[i];
                    }
                }
            }else{
                throw new Error(`ServerException: ${data.result}`);
            }
        })
        .catch(e => {
            $("#wait_window").hide();
            $("#menu_scene").hide();
            $("#title_scene").show();
            $("#alert_window p").text(`在庫の取得に失敗しました。少し時間を空けてから再度開始してください。\n(${e.name}:${e.message})`);
            $("#alert_window").show();
            console.error('There was a problem with the fetch operation:', e);
        });
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
    if(order_data[meal_id].count == order_data[meal_id].remain){
        target.attr("disabled",true);
    }
    target.siblings(".text_count").text(order_data[meal_id].count);
});

$(".decrement_trg").on("click",e=>{
    target = $(e.target);
    meal_id = target.data("target");
    console.log(meal_id,order_data[meal_id]);
    if(order_data[meal_id].count == order_data[meal_id].remain){
        target.siblings(".increment_trg").attr("disabled",false);
    }
    order_data[meal_id].count--;
    if(order_data[meal_id].count == 0){
        target.attr("disabled",true);
    }
    target.siblings(".text_count").text(order_data[meal_id].count);
});



$("#alert_close_trg").on("click",()=>{
    console.log("close");
    $("#alert_window").hide();
});

$("#order_trg").on("click",()=>{
    if(Object.values(order_data).some(v => v.count > 0)){
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
    }else{
        $("#alert_window p").text("かごに何も入っていません。");
        $("#alert_window").show();
    }
});

$("#order_cancel_trg").on("click",()=>{
    $("#menu_scene").show();
    window.scroll({top: 0,behavior: "instant"});
    $("#check_scene").hide();
});

$("#order_apply_trg").on("click",()=>{
    $("#wait_window p").text("注文を送信中。最大10秒程度かかります。");
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
            throw new Error("Network response was not ok");
        }
    })
    .then(data => {
        if(data.result == "OK"){
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

            $("#waiting_count").text(data.waiting_count);

            window.uuid = data.uuid;

            setInterval(()=>{
                waiting_reload_timer--;
                if(waiting_reload_timer > 0){
                    $("#reload_trg").text(`${waiting_reload_timer}秒後に人数を再取得可能`);
                    $("#reload_trg").attr("disabled",true);
                }else{
                    $("#reload_trg").text("人数を再取得する");
                    $("#reload_trg").attr("disabled",false);
                }
            },1000);

            $("#check_scene").hide();
            $("#wait_window").hide();
            window.scroll({top: 0,behavior: "instant"});
            $("#receipt_scene").show();
        }else if(data.result == "RemainShortage"){
            $("#wait_window").hide();
            $("#alert_window p").text(`ページを開いてから注文するまでの間に売り切れた料理がある可能性があります。注文を最初からやり直してください。\n(Error: ServerException: RemainShortage)`);
            $("#alert_close_trg").on("click",()=>{location.reload()});
            $("#alert_window").show();
        }else{
            throw new Error(`ServerException: ${data.result}`);
        }

        
    })
    .catch(e => {
        $("#wait_window").hide();
        $("#alert_window p").text(`注文の送信に失敗しました。少し時間を空けてから再度送信してください。\n(${e.name}:${e.message})`);
        $("#alert_window").show();
        console.error('There was a problem with the fetch operation:', e);
    });
});

$("#reload_trg").on("click",e=>{
    $("#wait_window p").text("人数を再取得中");
    $("#wait_window").show();

    fetch(SERVER_ADDRESS,{
        method:"POST",
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
            type:"waiting_count",
            uuid:uuid,
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }else{
            throw new Error("Network response was not ok");
        }
    })
    .then(data => {
        if(data.result == "OK"){
            console.log(data);
            $("#wait_window").hide();
            $("#waiting_count").text(data.waiting_count);
            waiting_reload_timer = 60;
        }else{
            throw new Error(`ServerException: ${data.result}`);
        }
    })
    .catch(e => {
        $("#wait_window").hide();
        $("#alert_window p").text(`人数の取得に失敗しました。少し時間を空けてから再度開始してください。\n(${e.name}:${e.message})`);
        $("#alert_window").show();
        console.error('There was a problem with the fetch operation:', e);
    });
});

window.waiting_reload_timer = 60;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
$("#seat_id").text(urlParams.get("seat_id"));

window.order_data = {
    "kebab":{
        "count":0,
        "price":0,
        "remain":0,
        "name":"ケバブ"
    },
    "nope":{
        "count":0,
        "price":150,
        "remain":0,
        "name":"NOPE"
    },
    "ice":{
        "count":0,
        "price":80,
        "remain":0,
        "name":"かき氷"
    },
    "crepe":{
        "count":0,
        "price":120,
        "remain":0,
        "name":"クレープ"
    },
    "chicken":{
        "count":0,
        "price":130,
        "remain":0,
        "name":"焼き鳥"
    },
    "doritos":{
        "count":0,
        "price":100,
        "remain":0,
        "name":"ドリトス"
    },
};

window.SERVER_ADDRESS = "https://script.google.com/macros/s/AKfycbzcC6BAv4YC3DLHGX4RxLZL1ro8YcS-KJJwauU8rZSp0weYaekcyuMI-EQOfGJcwsW0Kw/exec";