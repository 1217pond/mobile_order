$("#start_trg").on("click",()=>{
    console.log("start");
    setTimeout(()=>{
        $("#title_scene").hide();
        window.scroll({top: 0,behavior: "instant"});
        $("#menu_scene").show();
    },1500);
});

$(".select_trg").on("click",e=>{
    target = $(e.target);
    if(target.attr("selected")){
        meal = target.data("target");
        $("#alert_window p").text(`${meal}をキャンセルしました。`);
        $("#alert_window").show();
        target.text("かごにいれる");
        target.attr("selected",false);
    }else{
        meal = target.data("target");
        $("#alert_window p").text(`${meal}をかごに入れました。`);
        $("#alert_window").show();
        target.text("キャンセル");
        target.attr("selected",true);
    }
    
});

$("#alert_window button").on("click",()=>{
    console.log("close");
    $("#alert_window").hide();
});

$("#order_trg").on("click",()=>{
    $("#order_list").empty();
    total_price=0;
    $(".select_trg").each(function(i){
        if($(this).attr("selected")){
            $("#order_list").append(`<li>${$(this).data("target")}${$(this).data("is_main") ? "　※主食はチケットを持っていないと食べられません！" : ""}</li>`);
            console.log(Number($(this).data("price")));
            total_price += Number($(this).data("price"));
        }
    });
    $("#total_price").text(`￥${total_price}-`);

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
    setTimeout(() => {
        $("#wait_window").hide();
        $("#check_scene").hide();
        window.scroll({top: 0,behavior: "instant"});
        $("#receipt_scene").show();
    }, 3000);
});