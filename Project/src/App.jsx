import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { pipeline } from '@xenova/transformers'
import { createClient } from '@supabase/supabase-js'
import CourseCard from './components/CourseCard';
import CourseListItem from './components/CourseListItem';
import {MantineProvider, TextInput, Grid, Center, Title, Button, Loader, SegmentedControl, Checkbox} from "@mantine/core"
import {LayoutList, LayoutGrid} from "tabler-icons-react"
import { Analytics } from '@vercel/analytics/react'

function App() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_KEY
  const [query, setQuery] = useState('');
  const [recs, setRecs] = useState(null)
  const [awaitingResponse, setAwaitingResponse] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [showAvailable, setShowAvailable] = useState(false) 
  async function getRecs() {
    const supabase = createClient(url, key)
    setAwaitingResponse(true)
    const generateEmbedding = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L12-v2')
    const modQuery = query.replace(" ", "") // add or operator if needed
    const { data:subjectNumberCourses, error: subjectNumberError} = await supabase.from('FA23').select("name, description, subject, number, available_term, subject_number").textSearch('subject_number', `'${modQuery}'`, {type: "word", config: "english"})
    if (subjectNumberCourses.length > 0) {
        // Get the embedding of the course description (only going to be one course)
        // Feed this back into the semantic search function
        // console.log("First triggered")
        // console.log(subjectNumberCourses[0])
        const courseDescription = subjectNumberCourses[0].description
        const output = await generateEmbedding(courseDescription, {
          pooling: 'mean',
          normalize: true,
        })
        const embedding = Array.from(output.data)
        const {data:semanticCourses , error: semanticError} = await supabase.rpc('extract_results_384_FA23', {query: embedding})
        setRecs(compileRecs(semanticCourses, subjectNumberCourses))
    } else {
      // console.log("Second triggered")
      const output = await generateEmbedding(query, {
        pooling: 'mean',
        normalize: true,
      })
      const embedding = Array.from(output.data)
      const {data:semanticCourses , error: semanticError} = await supabase.rpc('extract_results_384_FA23', {query: embedding})
      const { data:keywordCourses, error: keywordError} = await supabase.from('FA23').select("name, description, subject, number, available_term, subject_number").textSearch('name_description', `'${modQuery}'`, {type: "word", config: "english"})
      var foundCourses = compileRecs(semanticCourses.map(course => course.subject_number), keywordCourses.map(course => course.subject_number)).toString()
      const {data:similarities, error: similaritiesError} = await supabase.rpc('get_similarities', {query: embedding, foundcourses: foundCourses})
      //console.log(similarities)
      var similarities_dict = similarities.reduce((obj, item) => {
        obj[item.subject_number] = item.distance
        return obj
      })
      similarities_dict[similarities_dict["subject_number"]] = similarities_dict["distance"]
      delete similarities_dict.distance
      delete similarities_dict.subject_number
      foundCourses = foundCourses.split(",").sort(function(a, b){return similarities_dict[a] - similarities_dict[b]})
      var totalCourses = compileRecs(semanticCourses, keywordCourses)
      foundCourses = foundCourses.map(course => totalCourses.find(c => c.subject_number == course))
      //console.log(foundCourses)
      setRecs(foundCourses)
    }
    setAwaitingResponse(false)
  }
  function compileRecs(semanticCourses, keywordCourses) {
    var compiled = []
    for (var i = 0; i < keywordCourses.length; i++) {
      if (!compiled.includes(JSON.stringify(keywordCourses[i]))) {
        compiled.push(JSON.stringify(keywordCourses[i]))
      }
    }
    for (var i = 0; i < semanticCourses.length; i++) {
      if (!compiled.includes(JSON.stringify(semanticCourses[i]))) {
        compiled.push(JSON.stringify(semanticCourses[i]))
      }
    }
    for (var i = 0; i < compiled.length; i++) {
      compiled[i] = JSON.parse(compiled[i])
    }
    return compiled
  }
  function changeViewMode() {
    setViewMode(!viewMode)
  }
  function handleEnterPress(e) {
    if (e.key == 'Enter') {
      getRecs()
    }
  }
  
  return (
    <div className="App">
      <MantineProvider theme={{ colorScheme: 'dark'}}>
      <Analytics />
      <Center>
        <Title order={1} c="white">ClassMate UIUC</Title>
      </Center>
      <Center>
        <TextInput style={{width: "35vw", fontSize: "14" }} m="2em" radius="md" value={query} onChange={(event) => setQuery(event.currentTarget.value)} onKeyDown={(e) => handleEnterPress(e)} c="white" placeholder="Find me courses in..." />
      </Center>
      <Center>
        <Button onClick={getRecs} color="violet.5" mb="2em">Search</Button>
      </Center>
      {awaitingResponse && (
        <Center>
          <Loader size="md" color="violet.5"/>
        </Center>
      )}
        {recs && recs.length > 0 ? (
          <>
          <SegmentedControl
                value={viewMode}
                onChange={changeViewMode}
                data={[
                  {
                    value: false,
                    label: (
                      <Center>
                        <LayoutList style={{ width: "rem(16)", height: "rem(16)" }} />
                      </Center>
                    ),
                  },
                  {
                    value: true,
                    label: (
                      <Center>
                        <LayoutGrid style={{ width: "rem(16)", height: "rem(16)" }} />
                      </Center>
                    ),
                  }
                ]}
            />
            <Center>
                <Checkbox checked={showAvailable} mt="1.5em" mb="0.8em" label="Available Spring 2024" onChange={(event) => setShowAvailable(event.currentTarget.checked)} />
            </Center>
        {viewMode ? (
        <Grid>
          {recs.map((course, index) => (
            (((showAvailable && course.available_term == 1) || (!showAvailable)) && (
                <Grid.Col span={4}>
                  <CourseCard name={course.name} description={course.description} subject={course.subject} number={course.number}     available_term={course.available_term}></CourseCard>
                </Grid.Col>
            ))
            ))}
        </Grid>
        ) : (
          <div>
            {recs.map((course) => (
                (((showAvailable && course.available_term == 1) || (!showAvailable)) && (
                    <Center>
                      <CourseListItem name={course.name} description={course.description} subject={course.subject} number={course.number} available_term={course.available_term}/>
                    </Center>
                ))
            ))}
          </div>
        )}
        </>
        ) : (
          null
        )
      }
      </MantineProvider>
    </div>
  )
}

export default App

/*

 
const [showAvailable, setShowAvailable] = useState(false) 
((showAvailable && course.available_term == 1) || (!showAvailable) && (
*/