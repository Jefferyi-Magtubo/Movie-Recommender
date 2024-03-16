import React from "react"
import { useLocation } from "react-router-dom"
import { options } from "../APIoptions"
import { NavLink } from "react-router-dom"


export default function Recommendation() {
    const location = useLocation()

    if (!location.state) {
        window.location.href = "/"
    }

    const [pickedMovie, setPicked] = React.useState<boolean>(false)

    //Getting all the movies that the crew have worked together on
    const [crewMovies, setCrewMovies] = React.useState<number[] >([])

    React.useEffect(() => {
        console.log(crewMovies)
    },[crewMovies])

    
    React.useEffect(() => {
        async function fetchCrewMovies() {
        
        const crewQuery = location.state.castAndCrew.filter((person: {id: number, job: string}) => person.job != "Actor").map((person: {id: number, job: string}) => {return person})

        console.log(crewQuery)
        const currentCrewMovies : number[] = []

        crewQuery.forEach(async (person : {id: number, job: string}) => {
            const res = await fetch(`https://api.themoviedb.org/3/person/${person.id}/movie_credits?language=en-US`, options)
            const crewResults = await res.json()
            
            let moviesToCheck : number[] = []
            if(crewQuery.indexOf(person) === 0 && crewQuery.length === 1) {
                console.log('we ran')
                crewResults.crew.forEach((credit: {job: string, id: number}) => {
                    console.log("here", credit.job === person.job)
                    if(credit.job === person.job) {
                        setCrewMovies(oldCredits => [...oldCredits, credit.id])
                    }
                })
            } else if (crewQuery.indexOf(person) === 0) {
                crewResults.crew.forEach((credit: {job: string, id: number}) => {
                    if(credit.job === person.job) {
                        currentCrewMovies.push(credit.id)
                    }
                })
            }else {
                crewResults.crew.forEach((credit: {id: number, job: string}) => {
                    if(credit.job === person.job) {
                        moviesToCheck.push(credit.id)
                    } 
                })
                const newCrewMovies = moviesToCheck.filter(element => currentCrewMovies.includes(element))
                setCrewMovies(newCrewMovies)
            }
        })}

        fetchCrewMovies()
    }, [])

    const [searchResults, setSearchResults] = React.useState<number[]>([])

    React.useEffect(() => {
        async function fetchFilteredMovies() {
            const filteredMovies = []
            const actorsQuery = location.state.castAndCrew.filter((person: {id: number, job: string}) => person.job == "Actor")
            .map((actor: {id: number, job: string}) => {return actor.id}).join("%2C")
            const genresQuery = location.state.genres.join("%2C")
            for (let i = 1; i < 21; i++) {
                const resData = await fetch(`https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=${i}${location.state.year ? `&primary_release_year=${location.state.year}` : ""}&sort_by=popularity.desc${actorsQuery ? `&with_cast=${actorsQuery}` : ""}${genresQuery ? `&with_genres=${genresQuery}` : ""}${location.state.language ? `&with_original_language=${location.state.language}` : ""}${location.state.runtime ? `&with_runtime.gte=${location.state.runtime - 8}`  : ""}${location.state.runtime ? `&with_runtime.lte=${location.state.runtime + 8}` : ""}`, options)
                const data = await resData.json()
                const pageData = data.results.map((movie : { id: number}) => movie.id)
                filteredMovies.push(pageData)
            }
            const finalList = [].concat(...filteredMovies)

            setSearchResults(finalList)
        }

        fetchFilteredMovies();
    }, []);

    console.log(crewMovies)
    console.log(searchResults)

    const finalFilteredList = crewMovies.length > 0 && searchResults.length < 400? searchResults.filter((movie) => crewMovies.includes(movie)).filter(movie => movie !== location.state.currentMovie): 
    crewMovies.length > 0 && searchResults.length === 400? crewMovies.filter(movie => movie !== location.state.currentMovie) :
    crewMovies.length === 0 && searchResults.length > 0 ? []:
    ""

    console.log(finalFilteredList)                        
    const randomMovie = finalFilteredList[Math.floor(Math.random() * finalFilteredList.length)]

    const [recdMovie, setRecdMovie] = React.useState<{title: string, poster_path: string}>({title: "", poster_path: ""})

    React.useEffect(() => {
        async function getRecdMovie() {
            const finalRes = await fetch(`https://api.themoviedb.org/3/movie/${randomMovie}?language=en-US`, options)
            const recdMovieData = await finalRes.json()
            setRecdMovie(recdMovieData)
            setPicked(true)
        }
        getRecdMovie()
    }, [randomMovie])

    return (
        pickedMovie && recdMovie.title ?
            <div className="recommendationElement">
                <h2>We Suggest You Watch:</h2>
                <h1>{recdMovie.title}</h1>
                <img className="moviePoster" alt={`This is the movie poster for ${recdMovie.title}.`} src={`https://image.tmdb.org/t/p/w300/${recdMovie.poster_path}`}/>
                <NavLink className={"button"} to={"/"}>Back to Home</NavLink>
                <h2>To minimzie the chances of bugs, go back home and refresh the page if you want another recommendation.</h2>
            </div> :
            <div className="recommendationElement">
                <h1>Finding the perfect movie... give us a moment...</h1>
                <h2>If you've been stuck on this page for a while, go back to the home page and narrow down your search.</h2>
                <NavLink className={"button"} to={"/"}>Back to Home</NavLink>
            </div>
            
    )
}