import { useState, useEffect, useRef } from "react";
import { loadingGif, first, fourth, sixth } from "./assets";

const App = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const fullscreenMapRef = useRef(null);

  const lastClickedLatLng = useRef(null);
  //
  const [selectedGif, setSelectedGif] = useState(null);
  //
  const [apiKey, setApiKey] = useState(localStorage.getItem("apiKey") || "");
  //
  const polylineRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  //
  const [currDist, setCurrDist] = useState(0);
  const [loadedData, setLoadedData] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);
  const [time, setTime] = useState(150000);

  useEffect(() => {
    const gifs = [first, fourth, sixth];
    setSelectedGif(gifs[Math.floor(Math.random() * gifs.length)]);
  }, []);

  useEffect(() => {
    if (apiKey) {
      const loadGoogleMapsScript = () => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
        script.defer = true;
        script.async = true;
        document.head.appendChild(script);
        script.onload = () => initMap();
      };

      const initMap = () => {
        generateRandomPoint();
        const map = new window.google.maps.Map(document.getElementById("map"), {
          center: { lat: 0, lng: 0 },
          zoom: 1,
          disableDefaultUI: true,
          draggableCursor: "crosshair",
        });

        mapRef.current = map;
        map.addListener("click", (event) => {
          handleMapClick(event.latLng);
        });

        const fullscreenMap = new window.google.maps.Map(
          document.getElementById("fullscreenMap"),
          {
            center: { lat: 0, lng: 0 },
            zoom: 2,
            disableDefaultUI: true,
          }
        );

        fullscreenMapRef.current = fullscreenMap;
        return () => {
          if (mapRef.current) {
            mapRef.current.removeListener("click");
          }
        };
      };
      loadGoogleMapsScript();
    }
  }, [apiKey]);

  const generateRandomPoint = () => {
    const sv = new window.google.maps.StreetViewService();
    sv.getPanoramaByLocation(
      new window.google.maps.LatLng(
        Math.random() * 180 - 90,
        Math.random() * 360 - 180
      ),
      500,
      processSVData
    );
  };

  const processSVData = (data, status) => {
    if (status === window.google.maps.StreetViewStatus.OK) {
      setLoadedData(data);
      const panorama = new window.google.maps.StreetViewPanorama(
        document.getElementById("panoramamap"),
        {
          position: data.location.latLng,
          pov: {
            heading: 0,
            pitch: 0,
            zoom: 0,
          },
          disableDefaultUI: true,
          showRoadLabels: false,
          linksControl: true,
          fullscreenControl: false,
        }
      );
      mapRef.current.setStreetView(panorama);
    } else {
      generateRandomPoint();
    }
  };

  const handleMapClick = (clickedLatLng) => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const marker = new window.google.maps.Marker({
      position: clickedLatLng,
      map: mapRef.current,
      title: "",
      clickable: false,
    });

    markerRef.current = marker;
    lastClickedLatLng.current = clickedLatLng;
  };

  const clearOverlays = () => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (startMarkerRef.current) {
      startMarkerRef.current.setMap(null);
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.setMap(null);
      endMarkerRef.current = null;
    }
  };

  const handleSubmitClick = async () => {
    mapRef.current,
    {
      center: { lat: 0, lng: 0 },
      zoom: 1,
    };
    fullscreenMapRef.current,
    {
      center: { lat: 0, lng: 0 },
      zoom: 1,
    };
    stopTimer();

    const panoramaCoordinates = await mapRef.current
      .getStreetView()
      .getLocation().latLng;
    const distance =
      window.google.maps.geometry.spherical.computeDistanceBetween(
        lastClickedLatLng.current,
        panoramaCoordinates
      );

    if (distance) {
      setCurrDist(distance.toFixed(2) / 1000);
    }

    const lineCoordinates = [
      {
        lat: lastClickedLatLng.current.lat(),
        lng: lastClickedLatLng.current.lng(),
      },
      { lat: panoramaCoordinates.lat(), lng: panoramaCoordinates.lng() },
    ];

    const polyline = new window.google.maps.Polyline({
      path: lineCoordinates,
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
      elevation: 0,
    });

    polyline.setMap(fullscreenMapRef.current);
    const startMarker = new window.google.maps.Marker({
      position: lineCoordinates[0],
      map: fullscreenMapRef.current,
      title: "",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#FF0000",
        fillOpacity: 1,
        strokeWeight: 0,
      },
    });

    const endMarker = new window.google.maps.Marker({
      position: lineCoordinates[1],
      map: fullscreenMapRef.current,
      title: "",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#00FF00",
        fillOpacity: 1,
        strokeWeight: 0,
      },
    });
    setSubmitted(true);
    setLoadedData(null);
    //
    polylineRef.current = polyline;
    startMarkerRef.current = startMarker;
    endMarkerRef.current = endMarker;
    //
  };

  const resetCoordinates = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    lastClickedLatLng.current = null;
    mapRef.current.panTo({ lat: 0, lng: 0 });
    mapRef.current.setZoom(2);
  };

  const resetFullscreenMap = () => {
    if (fullscreenMapRef.current) {
      fullscreenMapRef.current.setCenter({ lat: 0, lng: 0 });
      fullscreenMapRef.current.setZoom(2);
    }
  };

  const startTimer = () => {
    let startTime = Date.now();
    let interval = setInterval(() => {
      let currentTime = Date.now();
      let incrementTime = currentTime - startTime;
      setTime((prevTime) => prevTime - incrementTime);
      startTime = currentTime;
    }, 1);
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTime(150000);
    }
  };

  useEffect(() => {
    if (time <= 0) {
      stopTimer();
      setTime(150000);
      setSubmitted(true);
      setLoadedData(null);
    }
  });

  useEffect(() => {
    if (loadedData) {
      startTimer();
    }
  }, [loadedData]);

  return (
    <div className="w-screen h-screen">
      <div className={`w-screen h-screen flex justify-center items-center gap-4 ${!apiKey ? "visible" : "hidden"}`}>
        <input placeholder="ENTER API KEY" className="text-center py-2 border-transparent border-[2px] bg-[#D5E1F5] hover:border-[gray] rounded-md" />
        <button onClick={() => {
          setApiKey(document.querySelector("input").value);
          localStorage.setItem("apiKey", document.querySelector("input").value);
        }} className='p-2 border-transparent border-[2px] bg-[#D5E1F5] hover:border-[gray] rounded-md'>SUBMIT</button>
      </div>
      <div
        className={`${!loadedData && !submitted && apiKey
          ? "visible w-screen h-screen flex justify-center items-center"
          : "hidden"
          }`}
      >
        <img src={loadingGif} />
      </div>
      <div
        className={`${submitted && apiKey ? "visible" : "hidden"
          } w-screen h-screen flex justify-center items-center flex-col`}
      >
        {/*  */}
        <div className="fixed bottom-0 left-0 z-20 p-4">
          {selectedGif && (
            <img
              src={selectedGif}
              alt=""
              className="max-w-[150px] rounded-lg shadow-lg"
            />
          )}
        </div>
        {/*  */}
        <div className="w-[60%] h-[60%] border-[8px] border-[#D5E1F5] gm-border gm-cursor">
          <div id="fullscreenMap" className="w-full h-full z-10" />
        </div>
        <div
          className={`w-full grid grid-cols-3 drop-shadow-2xl px-[20%] ${currDist > 0 ? "justify-between" : "justify-center"
            }  items-center`}
        >
          <a
            className={`${currDist > 0 ? "visible" : "hidden"
              } text-4xl text-[black] font-bold mt-4 text-center cursor-pointer z-20 p-4 bg-[#D5E1F5]  col-span-1`}
          >
            {currDist > 0 ? Math.round(currDist) + " KM" : ""}
          </a>
          <a
            onClick={() => {
              resetCoordinates();
              clearOverlays();
              generateRandomPoint();
              resetFullscreenMap();
              setSubmitted(false);
              setCurrDist(0);
              //
              const gifs = [first, fourth, sixth];
              setSelectedGif(gifs[Math.floor(Math.random() * gifs.length)]);
            }}
            className="text-4xl text-[black] w-full hover:text-[white] font-bold mt-4 cursor-pointer z-20 p-4 bg-[#D5E1F5] col-span-1 text-center"
          >
            NEXT
          </a>
          <a
            className={`${currDist > 0 ? "visible" : "hidden"
              } text-4xl text-[black] w-full font-bold col-span-1 text-center mt-4 cursor-pointer z-20 p-4 bg-[#D5E1F5]`}
          >
            SKIBIDI
          </a>
        </div>
      </div>
      <div className={`${!submitted && loadedData && apiKey ? "visible" : "hidden"}`}>
        <div>
          <div className="fixed w-full z-30">
            <div className="w-full h-full flex justify-center items-center">
              <p
                className={`${time < 90000 ? "text-[orange]" : ""} ${time < 30000 ? "text-[red]" : ""
                  } text-white font-bold text-6xl drop-shadow-2xl`}
              >
                {Math.floor(time / 60000)}:
                {("0" + Math.floor((time % 60000) / 1000)).slice(-2)}
              </p>
            </div>
          </div>
        </div>
        <div className={`${!apiKey ? "hidden" : ""} absolute bottom-0 right-0 z-20`}>
          <div className="w-[440px] hover:w-[660px] h-[280px] hover:h-[420px] relative gm-border gm-cursor ease-in-out duration-100">
            <div
              id="map"
              className="w-full rounded-tl-md"
              style={{ height: "calc(100% - 40px)" }}
            />
            <div
              onClick={handleSubmitClick}
              className="w-full h-[40px] absolute flex bottom-0 left-0 justify-center items-center bg-[#D5E1F5] text-2xl font-bold text-gray hover:text-white cursor-pointer"
            >
              <p>GUESS</p>
            </div>
          </div>
        </div>
      </div>
      <div
        id="panoramamap"
        className={`${!submitted && loadedData && apiKey ? "visible" : "hidden"
          } w-[100%] h-[100%] z-10`}
      />
    </div>
  );
};

export default App;
